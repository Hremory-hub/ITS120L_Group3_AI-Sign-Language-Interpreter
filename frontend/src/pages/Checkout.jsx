/**
 * /checkout?tier=professional&period=monthly  (or annual)
 *
 * Handles:
 *  - Guest: shows "sign up first" wall, preserves tier+period in sessionStorage
 *  - Logged-in user: shows plan summary → "Pay with PayMongo" button
 *  - Free tier: activates instantly, no payment
 */
import { useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { createCheckout, getMySubscription } from '../api'
import { navigate } from '../utils/navigate'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PLANS = {
  free: {
    name: 'Free', color: 'gray',
    price: { monthly: 0, annual: 0 },
    features: ['1 active session at a time', 'Sign Language Alphabet', '5 Class Profiles', 'Basic transcript export', 'Email support'],
  },
  professional: {
    name: 'Professional', color: 'teal',
    price: { monthly: 100, annual: 900 },
    features: ['Unlimited sessions', 'Speech to Sign Language', '15 Class Profiles', 'Full transcript history', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise', color: 'violet',
    price: { monthly: 260, annual: 2340 },
    features: ['Everything in Professional', 'Unlimited classrooms', 'Custom Vocabulary', 'Design System Foundation', 'Variants & Properties'],
  },
}

function getParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    tier:   (p.get('tier')   || 'free').toLowerCase(),
    period: (p.get('period') || 'monthly').toLowerCase(),
  }
}

export default function Checkout() {
  const { tier, period } = getParams()
  const plan = PLANS[tier] || PLANS.free

  const [user,       setUser]       = useState(undefined)   // undefined = loading
  const [sub,        setSub]        = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try { setSub(await getMySubscription()) } catch { /* ignore */ }
      }
    })
    return () => unsub()
  }, [])

  // Preserve intended plan in sessionStorage for post-signup redirect
  useEffect(() => {
    sessionStorage.setItem('kamai_pending_tier',   tier)
    sessionStorage.setItem('kamai_pending_period', period)
  }, [tier, period])

  const price  = plan.price[period] ?? plan.price.monthly
  const annual = period === 'annual'

  const handlePay = async () => {
    setError(''); setLoading(true)
    try {
      const res = await createCheckout(tier, period)
      if (!res.checkout_url) {
        // Free tier activated
        sessionStorage.removeItem('kamai_pending_tier')
        sessionStorage.removeItem('kamai_pending_period')
        window.location.href = '/payment/success?tier=free&period=' + period
        return
      }
      // Redirect to PayMongo hosted checkout
      window.location.href = res.checkout_url
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading state ──
  if (user === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
    </div>
  )

  // ── Guest wall ──
  if (!user) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-2xl text-gray-900 mb-2">Create your account first</h1>
            <p className="text-gray-500 text-sm mb-2">
              You're signing up for the{' '}
              <span className="font-semibold text-teal-600">{plan.name}</span> plan
              {price > 0 && (
                <> at <span className="font-semibold">₱{price}/{annual ? 'yr' : 'mo'}</span></>
              )}.
            </p>
            <p className="text-gray-400 text-xs mb-8">
              After creating your account you'll be taken straight to checkout.
            </p>

            {/* Plan badge */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 mb-6 text-left">
              <div>
                <p className="text-xs text-gray-400 font-medium">Selected plan</p>
                <p className="text-sm font-bold text-gray-900">{plan.name} · {period.charAt(0).toUpperCase() + period.slice(1)}</p>
              </div>
              {price > 0
                ? <p className="text-lg font-black text-teal-600" style={{ fontFamily:'var(--font-display)' }}>₱{price}</p>
                : <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Free</span>
              }
            </div>

            <button
              onClick={() => {
                sessionStorage.setItem('kamai_post_verify_redirect', `/checkout?tier=${tier}&period=${period}`)
                navigate(`/signup`)
              }}
              className="block w-full btn-shimmer text-white font-semibold py-3.5 rounded-xl text-sm mb-4">
              Create Account &amp; Continue
            </button>
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => {
                  sessionStorage.setItem('kamai_post_verify_redirect', `/checkout?tier=${tier}&period=${period}`)
                  navigate(`/signin`)
                }}
                className="text-teal-600 font-semibold hover:underline">Sign in</button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )

  // ── Already on this tier ──
  const alreadyOnTier = sub?.tier === tier && sub?.status === 'paid'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">

          {/* Back */}
          <a href="/#pricing"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to pricing
          </a>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header stripe */}
            <div className={`px-8 py-6 ${tier === 'professional' ? 'bg-teal-500' : tier === 'enterprise' ? 'bg-violet-600' : 'bg-gray-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${tier !== 'free' ? 'text-white/70' : 'text-gray-400'}`}>
                {tier === 'free' ? 'No credit card needed' : 'Secure checkout via PayMongo'}
              </p>
              <h1 style={{ fontFamily: 'var(--font-display)' }}
                className={`font-black text-2xl sm:text-3xl ${tier !== 'free' ? 'text-white' : 'text-gray-900'}`}>
                {plan.name} Plan
              </h1>
              {price > 0 && (
                <div className="flex items-end gap-1 mt-2">
                  <span style={{ fontFamily: 'var(--font-display)' }}
                    className="text-4xl font-black text-white">₱{price}</span>
                  <span className="text-white/70 text-sm mb-1">/{annual ? 'year' : 'month'}</span>
                </div>
              )}
            </div>

            <div className="px-8 py-6">

              {/* Billing toggle reminder */}
              {price > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">{annual ? 'Annual' : 'Monthly'} billing</span>
                    {annual && ' — you save 25% compared to monthly.'}
                    {!annual && ' — switch to annual to save 25%.'}
                  </p>
                </div>
              )}

              {/* Features list */}
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">What's included</p>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Error */}
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
                <div className="text-center py-4">
                  <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    You're already on this plan
                  </span>
                  <div className="mt-4">
                    <a href="/dashboard" className="text-sm text-teal-600 font-semibold hover:underline">
                      Go to Dashboard →
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={handlePay} disabled={loading}
                    className="w-full btn-shimmer text-white font-bold py-4 rounded-2xl text-sm
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
                      Secured by{' '}
                      <span className="font-semibold text-gray-500">PayMongo</span>
                      {' '}· Accepts GCash, Maya, Credit/Debit cards
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
