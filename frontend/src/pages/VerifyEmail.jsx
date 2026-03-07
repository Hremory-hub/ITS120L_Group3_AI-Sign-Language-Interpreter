import { useState, useEffect } from 'react'
import { auth } from '../firebase'
import { sendEmailVerification, signOut, onAuthStateChanged, reload } from 'firebase/auth'

export default function VerifyEmail() {
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError]       = useState('')
  const [user, setUser]         = useState(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendVerification = async () => {
    if (!user) return
    setSending(true)
    setError('')
    try {
      await sendEmailVerification(user)
      setSent(true)
      setCountdown(60) // 60s cooldown before resend
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before trying again.')
      } else {
        setError(err.message)
      }
    } finally {
      setSending(false)
    }
  }

  

  const handleCheckVerified = async () => {
    if (!user) return
    setChecking(true)
    setError('')
    try {
      await reload(user) // refresh user from Firebase
      if (auth.currentUser?.emailVerified) {
        const redirect = sessionStorage.getItem('kamai_post_verify_redirect')
        if (redirect) {
          sessionStorage.removeItem('kamai_post_verify_redirect')
          window.location.href = redirect
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        setError("Email not verified yet. Please check your inbox and click the link.")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center">

          {/* Icon */}
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-xl text-gray-900">
              Kam<span className="text-teal-500">AI</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)' }}
            className="font-bold text-2xl text-gray-900 mb-2">
            Verify your email
          </h1>

          <p className="text-sm text-gray-500 mb-2">
            We sent a verification link to:
          </p>
          <p className="text-sm font-semibold text-teal-600 mb-6 truncate">
            {user?.email}
          </p>

          {sent ? (
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-5 text-sm text-teal-700">
                ✅ Verification email sent! Check your inbox (and spam folder).
            </div>
            ) : (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-700">
                📧 Click the button below to receive your verification email.
            </div>
            )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Steps */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-3">
            {[
              'Open the email we sent you',
              'Click the verification link',
              'Come back here and click "I\'ve verified"',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>

          {/* I've verified button */}
          <button
            onClick={handleCheckVerified}
            disabled={checking}
            className="w-full btn-shimmer text-white font-semibold py-3 rounded-xl text-sm mb-3 transition-all disabled:opacity-60"
          >
            {checking ? 'Checking...' : "✅ I've verified my email"}
          </button>

          {/* Resend button */}
          <button
            onClick={handleSendVerification}
            disabled={sending || countdown > 0}
            className="w-full py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl
              hover:border-teal-400 hover:text-teal-600 transition-all disabled:opacity-50 mb-4"
          >
            {sending
              ? 'Sending...'
              : countdown > 0
              ? `Resend in ${countdown}s`
              : 'Resend verification email'}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  )
}