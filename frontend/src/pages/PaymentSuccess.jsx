/**
 * /payment/success
 * PayMongo redirects here after a successful checkout.
 * Params: ?tier=X&period=Y   (link_id may also be present but we verify server-side)
 *
 * For Free tier: no link_id, just activates immediately
 * For paid tiers: calls backend GET /payments/success to verify + activate
 */
import { useState, useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { verifyPayment } from '../api'
import Navbar from '../components/Navbar'

function getParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    tier:   (p.get('tier')   || 'free').toLowerCase(),
    period: (p.get('period') || 'monthly').toLowerCase(),
    linkId: p.get('link_id') || null,
  }
}

const TIER_PERKS = {
  free:         { emoji: '🎉', label: 'Free',         desc: 'Your account is ready to use.' },
  professional: { emoji: '🚀', label: 'Professional', desc: 'Unlimited sessions and priority support are now active.' },
  enterprise:   { emoji: '🏆', label: 'Enterprise',   desc: 'All features unlocked for your team.' },
}

export default function PaymentSuccess() {
  const { tier, period, linkId } = getParams()
  const perk = TIER_PERKS[tier] || TIER_PERKS.free

  const [status,  setStatus]  = useState('verifying')   // verifying | success | error
  const [errMsg,  setErrMsg]  = useState('')
  const [user,    setUser]    = useState(null)
  const verified  = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u || verified.current) return
      verified.current = true

      // Free tier — backend was already called from Checkout, just show success
      if (tier === 'free' || !linkId) {
        setStatus('success')
        sessionStorage.removeItem('kamai_pending_tier')
        sessionStorage.removeItem('kamai_pending_period')
        return
      }

      // Paid tier — verify with backend
      try {
        await verifyPayment(linkId, tier, period)
        setStatus('success')
        sessionStorage.removeItem('kamai_pending_tier')
        sessionStorage.removeItem('kamai_pending_period')
      } catch (e) {
        setStatus('error')
        setErrMsg(e.message || 'Payment verification failed.')
      }
    })
    return () => unsub()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">

          {status === 'verifying' && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin mx-auto mb-6" />
              <h2 style={{ fontFamily: 'var(--font-display)' }}
                className="font-black text-xl text-gray-900 mb-2">Confirming your payment…</h2>
              <p className="text-gray-400 text-sm">This only takes a moment.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
              {/* Animated checkmark */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-500 flex items-center justify-center">
                  <svg className="w-9 h-9 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 text-2xl">{perk.emoji}</span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)' }}
                className="font-black text-2xl text-gray-900 mb-1">
                {tier === 'free' ? "You're all set!" : "Payment successful!"}
              </h2>
              <p className="text-teal-600 font-semibold text-sm mb-3">{perk.label} Plan activated</p>
              <p className="text-gray-500 text-sm mb-8">{perk.desc}</p>

              {/* Plan summary chip */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-8">
                <span className="text-sm text-gray-600 font-medium">
                  {perk.label} · {period.charAt(0).toUpperCase() + period.slice(1)}
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
              </div>

              <a href="/dashboard"
                className="block w-full btn-shimmer text-white font-bold py-3.5 rounded-2xl text-sm mb-3">
                Go to Dashboard
              </a>
              <a href="/profile"
                className="block w-full text-center py-3 text-sm font-semibold text-gray-600
                  border border-gray-200 rounded-2xl hover:border-teal-400 hover:text-teal-600 transition-all">
                View my profile
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-400 flex items-center justify-center mx-auto mb-6">
                <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)' }}
                className="font-black text-2xl text-gray-900 mb-2">Verification failed</h2>
              <p className="text-gray-500 text-sm mb-4">
                Your payment may have gone through but we couldn't confirm it automatically.
              </p>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
                <p className="text-xs text-red-600 font-mono">{errMsg}</p>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                If you were charged, please contact support with your PayMongo transaction ID and
                we'll activate your plan within 1 business day.
              </p>
              <div className="flex gap-3">
                <a href={`/checkout?tier=${tier}&period=${period}`}
                  className="flex-1 btn-shimmer text-white font-semibold py-3 rounded-xl text-sm text-center">
                  Try again
                </a>
                <a href="/"
                  className="flex-1 text-center py-3 text-sm font-semibold text-gray-600
                    border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                  Go home
                </a>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
