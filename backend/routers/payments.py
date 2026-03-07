"""
/payments routes — PayMongo Payment Links integration

Endpoints:
  POST /payments/checkout          → create a PayMongo payment link, return checkout_url
  GET  /payments/success           → called after redirect back; verify + activate tier
  GET  /payments/my-subscription   → return current tier for logged-in user

PayMongo flow used:
  1. Backend creates a Payment Link via PayMongo API
  2. User is redirected to PayMongo's hosted checkout page
  3. On success, PayMongo redirects to:  {FRONTEND_URL}/payment/success?tier=X&period=Y&link_id=Z
  4. Frontend calls GET /payments/success?link_id=Z&tier=X&period=Y (with Bearer token)
  5. Backend verifies link status via PayMongo API, writes subscription row
"""
import os
import base64
import httpx
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth_middleware import get_current_user
import models, schemas

router = APIRouter(prefix="/payments", tags=["payments"])

# ── Config ────────────────────────────────────────────────────────────────────
PAYMONGO_SECRET = os.getenv("PAYMONGO_SECRET_KEY", "")
PAYMONGO_BASE   = "https://api.paymongo.com/v1"
FRONTEND_URL    = os.getenv("FRONTEND_URL", "http://localhost:5173")

# All amounts in centavos (1 PHP = 100 centavos).
# PayMongo minimum is PHP 100.00 = 10000 centavos.
PRICES = {
    "professional": {"monthly": 10000, "annual":  90000},   # PHP 100/mo, PHP 900/yr
    "enterprise":   {"monthly": 26000, "annual": 234000},   # PHP 260/mo, PHP 2340/yr
    "free":         {"monthly":     0, "annual":      0},
}

TIER_LABELS = {
    "professional": "KamAI Professional",
    "enterprise":   "KamAI Enterprise",
}


def _auth_header() -> dict:
    """Base64-encode the secret key for PayMongo Basic Auth."""
    encoded = base64.b64encode(f"{PAYMONGO_SECRET}:".encode()).decode()
    return {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}


def _months_from_period(period: str) -> int:
    return 12 if period == "annual" else 1


# POST /payments/checkout ──────────────────────────────────────────────────────
@router.post("/checkout")
async def create_checkout(
    payload:      schemas.CreateCheckoutRequest,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tier   = payload.tier.lower()
    period = payload.billing_period.lower()

    if tier not in PRICES:
        raise HTTPException(400, detail="Invalid tier.")
    if period not in ("monthly", "annual"):
        raise HTTPException(400, detail="billing_period must be 'monthly' or 'annual'.")
    if tier == "free":
        # Free tier — just upsert subscription immediately, no payment needed
        _upsert_subscription(db, current_user.id, "free", period, None, None, 0, "paid")
        return {"checkout_url": None, "tier": "free"}

    amount = PRICES[tier][period]

    # Build success / failure redirect URLs
    success_url = (
        f"{FRONTEND_URL}/payment/success"
        f"?tier={tier}&period={period}"
    )
    cancel_url = f"{FRONTEND_URL}/payment/cancelled?tier={tier}"

    body = {
        "data": {
            "attributes": {
                "amount":       amount,
                "currency":     "PHP",
                "description":  f"{TIER_LABELS[tier]} — {period.capitalize()} Plan",
                "remarks":      f"uid:{current_user.firebase_uid}|tier:{tier}|period:{period}",
                "success_url":  success_url,
                "cancel_url":   cancel_url,
            }
        }
    }

    if not PAYMONGO_SECRET:
        raise HTTPException(500, detail="PayMongo secret key not configured.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYMONGO_BASE}/links",
            json=body,
            headers=_auth_header(),
            timeout=15,
        )

    if resp.status_code not in (200, 201):
        detail = resp.json().get("errors", [{}])[0].get("detail", "PayMongo error")
        raise HTTPException(502, detail=f"PayMongo: {detail}")

    link_data   = resp.json()["data"]
    link_id     = link_data["id"]
    checkout_url = link_data["attributes"]["checkout_url"]

    # Store pending subscription so we can verify later
    _upsert_subscription(db, current_user.id, tier, period, link_id, None, amount, "pending")

    return {"checkout_url": checkout_url, "link_id": link_id}


# GET /payments/success ────────────────────────────────────────────────────────
@router.get("/success")
async def payment_success(
    link_id: str         = Query(...),
    tier:    str         = Query(...),
    period:  str         = Query(...),
    db:      Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Called by the frontend after PayMongo redirects back.
    Fetches the link status from PayMongo and activates the tier if paid.
    """
    if not PAYMONGO_SECRET:
        raise HTTPException(500, detail="PayMongo secret key not configured.")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYMONGO_BASE}/links/{link_id}",
            headers=_auth_header(),
            timeout=15,
        )

    if resp.status_code != 200:
        raise HTTPException(502, detail="Could not verify payment with PayMongo.")

    link_attr = resp.json()["data"]["attributes"]
    pm_status = link_attr.get("status")        # "paid" | "unpaid" | "archived"

    # Grab the actual payment id if available
    # PayMongo wraps each payment item; safely handle different response shapes
    raw_payments = link_attr.get("payments", [])
    payment_id   = None
    if raw_payments:
        p0 = raw_payments[0]
        # Shape A: { "id": "pay_xxx", ... }
        # Shape B: { "data": { "id": "pay_xxx", ... } }
        payment_id = p0.get("id") or (p0.get("data") or {}).get("id")

    if pm_status != "paid":
        raise HTTPException(402, detail=f"Payment not completed. PayMongo status: {pm_status}")

    amount = PRICES.get(tier, {}).get(period, 0)
    _upsert_subscription(db, current_user.id, tier, period, link_id, payment_id, amount, "paid")

    return {"success": True, "tier": tier, "billing_period": period}


# GET /payments/my-subscription ────────────────────────────────────────────────
@router.get("/my-subscription", response_model=schemas.SubscriptionOut)
def my_subscription(
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).first()

    if not sub:
        # Auto-provision a free tier row
        sub = models.Subscription(
            user_id=current_user.id,
            tier=models.UserTier.free,
            billing_period="monthly",
            status=models.PaymentStatus.paid,
        )
        db.add(sub); db.commit(); db.refresh(sub)

    return sub


# ── Helper ────────────────────────────────────────────────────────────────────

def _upsert_subscription(
    db, user_id, tier, period, link_id, payment_id, amount, status
):
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == user_id
    ).first()

    months = _months_from_period(period)
    now    = datetime.utcnow()

    if sub:
        sub.tier                 = tier
        sub.billing_period       = period
        sub.paymongo_link_id     = link_id
        sub.paymongo_payment_id  = payment_id
        sub.amount_paid          = amount
        sub.status               = status
        sub.started_at           = now
        sub.expires_at           = now + timedelta(days=30 * months) if status == "paid" else None
    else:
        sub = models.Subscription(
            user_id             = user_id,
            tier                = tier,
            billing_period      = period,
            paymongo_link_id    = link_id,
            paymongo_payment_id = payment_id,
            amount_paid         = amount,
            status              = status,
            started_at          = now,
            expires_at          = now + timedelta(days=30 * months) if status == "paid" else None,
        )
        db.add(sub)

    db.commit()
    db.refresh(sub)
    return sub
