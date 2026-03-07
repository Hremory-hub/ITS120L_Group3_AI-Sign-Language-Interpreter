/**
 * CheckoutModal — renders as an overlay on top of whatever page called it.
 * 
 * Usage:
 *   <CheckoutModal tier="professional" period="monthly" onClose={() => setOpen(false)} />
 *
 * Guest flow:  shows sign-up wall → stores redirect in sessionStorage → navigates to /signup
 * User flow:   shows plan summary → opens PayMongo in a NEW TAB (window.open)
 *              → polls every 3s to detect when payment succeeds
 * Free flow:   activates instantly, shows inline success
 */
import { useState, useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { createCheckout, getMySubscription, verifyPayment } from '../api'
import { navigate } from '../utils/navigate'

const PLANS = {
  free: {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    features: ['1 active session at a time', 'Sign Language Alphabet', '5 Class Profiles', 'Basic transcript export', 'Email support'],
  },
  professional: {
    name: 'Professional',
    price: { monthly: 100, annual: 900 },
    features: ['Unlimited sessions', 'Speech to Sign Language', '15 Class Profiles', 'Full transcript history', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: 260, annual: 2340 },
    features: ['Everything in Professional', 'Unlimited classrooms', 'Custom Vocabulary', 'Design System Foundation', 'Variants & Properties'],
  },
}

const TIER_COLORS = {
  free:         'bg-gray-100',
  professional: 'bg-teal-500',
  enterprise:   'bg-violet-600',
}

export default function CheckoutModal({ tier = 'professional', period = 'monthly', onClose, onSuccess }) {
  const plan   = PLANS[tier] || PLANS.free
  const price  = plan.price[period] ?? plan.price.monthly
  const annual = period === 'annual'

  const [user,       setUser]       = useState(undefined)
  const [sub,        setSub]        = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [phase,      setPhase]      = useState('checkout') // checkout | waiting | success

  const pollRef   = useRef(null)
  const linkIdRef = useRef(null)

  // Trap focus / close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try { setSub(await getMySubscription()) } catch { /* ignore */ }
      }
    })
    return () => unsub()
  }, [])

  // Poll backend every 4s to check if PayMongo payment completed
  const startPolling = (linkId) => {
    linkIdRef.current = linkId
    pollRef.current = setInterval(async () => {
      try {
        const result = await verifyPayment(linkId, tier, period)
        if (result.success) {
          clearInterval(pollRef.current)
          setPhase('success')
          onSuccess?.({ tier, period })
        }
      } catch {
        // still pending — keep polling
      }
    }, 4000)

    // Stop polling after 15 minutes (session timeout safety)
    setTimeout(() => clearInterval(pollRef.current), 15 * 60 * 1000)
  }

  const handlePay = async () => {
    setError(''); setLoading(true)
    try {
      const res = await createCheckout(tier, period)

      if (!res.checkout_url) {
        // Free tier — activated immediately
        setPhase('success')
        onSuccess?.({ tier, period })
        return
      }

      // Open PayMongo in a new tab — user stays on the current page
      window.open(res.checkout_url, '_blank', 'noopener')
      setPhase('waiting')
      startPolling(res.link_id)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const alreadyOnTier = sub?.tier === tier && sub?.status === 'paid'

  // ── Overlay backdrop ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden
        animate-[fadeInUp_0.2s_ease-out]"
        style={{ animation: 'fadeInUp 0.18s ease-out' }}>

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20
            flex items-center justify-center transition-colors text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* ── GUEST WALL ── */}
        {user === undefined && (
          <div className="p-10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
          </div>
        )}

        {user === null && (
          <>
            <div className={`${TIER_COLORS[tier]} px-8 pt-8 pb-6`}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Selected plan</p>
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-black text-2xl text-white">
                {plan.name}
              </h2>
              {price > 0 && (
                <p className="text-white/80 text-sm mt-1">
                  ₱{price}/{annual ? 'yr' : 'mo'}
                </p>
              )}
            </div>

            <div className="px-8 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)' }}
                className="font-black text-xl text-gray-900 mb-2">Create your account first</h3>
              <p className="text-gray-500 text-sm mb-6">
                After signing up you'll be brought right back to complete your purchase.
              </p>

              <button
                onClick={() => {
                  sessionStorage.setItem('kamai_post_verify_redirect', `/checkout?tier=${tier}&period=${period}`)
                  onClose()
                  navigate('/signup')
                }}
                className="w-full btn-shimmer text-white font-semibold py-3.5 rounded-xl text-sm mb-3">
                Create Account &amp; Continue
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('kamai_post_verify_redirect', `/checkout?tier=${tier}&period=${period}`)
                  onClose()
                  navigate('/signin')
                }}
                className="w-full py-3 text-sm font-semibold text-teal-600 border border-teal-200
                  rounded-xl hover:bg-teal-50 transition-colors">
                Sign In Instead
              </button>
            </div>
          </>
        )}

        {/* ── LOGGED IN — CHECKOUT ── */}
        {user && phase === 'checkout' && (
          <>
            <div className={`${TIER_COLORS[tier]} px-8 pt-8 pb-6`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${tier !== 'free' ? 'text-white/70' : 'text-gray-400'}`}>
                {tier === 'free' ? 'No credit card needed' : 'Secure checkout · PayMongo'}
              </p>
              <h2 style={{ fontFamily: 'var(--font-display)' }}
                className={`font-black text-2xl ${tier !== 'free' ? 'text-white' : 'text-gray-900'}`}>
                {plan.name} Plan
              </h2>
              {price > 0 && (
                <div className="flex items-end gap-1 mt-2">
                  <span style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-black text-white">
                    ₱{price}
                  </span>
                  <span className="text-white/70 text-sm mb-1">/{annual ? 'year' : 'month'}</span>
                </div>
              )}
            </div>

            <div className="px-8 py-5">
              {/* Features */}
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {alreadyOnTier ? (
                <div className="text-center py-3">
                  <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200
                    text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    You're already on this plan
                  </span>
                </div>
              ) : (
                <>
                  <button onClick={handlePay} disabled={loading}
                    className="w-full btn-shimmer text-white font-bold py-3.5 rounded-2xl text-sm
                      flex items-center justify-center gap-2 disabled:opacity-60 mb-3">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing…</>
                      : tier === 'free'
                        ? '🎉 Activate Free Plan'
                        : <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            Pay ₱{price} with PayMongo
                          </>
                    }
                  </button>
                  {tier !== 'free' && (
                    <p className="text-center text-xs text-gray-400">
                      Opens PayMongo in a new tab · GCash, Maya, Cards accepted
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── WAITING FOR PAYMENT ── */}
        {user && phase === 'waiting' && (
          <div className="px-8 py-12 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-xl text-gray-900 mb-2">Waiting for payment…</h3>
            <p className="text-gray-500 text-sm mb-1">Complete your payment in the PayMongo tab.</p>
            <p className="text-gray-400 text-xs mb-8">This window will update automatically when done.</p>
            <button onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Cancel and close
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {phase === 'success' && (
          <div className="px-8 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-500
              flex items-center justify-center mx-auto mb-5">
              <svg className="w-9 h-9 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-2xl text-gray-900 mb-1">
              {tier === 'free' ? "You're all set!" : 'Payment successful!'}
            </h3>
            <p className="text-teal-600 font-semibold text-sm mb-5">
              {plan.name} plan activated
            </p>
            <button onClick={() => { onClose(); navigate('/dashboard') }}
              className="w-full btn-shimmer text-white font-bold py-3.5 rounded-2xl text-sm mb-3">
              Go to Dashboard
            </button>
            <button onClick={onClose}
              className="w-full py-3 text-sm font-semibold text-gray-500 border border-gray-200
                rounded-2xl hover:border-gray-300 transition-colors">
              Stay on this page
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
