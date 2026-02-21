import { useState } from 'react'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth'
import { navigate } from '../utils/navigate'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignIn() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // ✅ Check if email is verified
      if (!cred.user.emailVerified) {
        // Send a fresh verification email and redirect to verify page
        await sendEmailVerification(cred.user)
        navigate('/verify-email')
        return
      }

      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please try again.')
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      // Google accounts are pre-verified
      if (cred.user.emailVerified) {
        navigate('/dashboard')
      } else {
        navigate('/verify-email')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-1/2 relative items-end p-12 overflow-hidden bg-gray-50">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-72 h-[420px] rounded-3xl bg-teal-200/60 rotate-3 translate-x-4 translate-y-2" />
          <div className="relative w-72 h-[420px] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=600&q=80"
              alt="Happy child giving thumbs up"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <img src="/assets/logo.png" alt="KamAI" className="h-10 w-auto"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
            <span className="hidden items-center justify-center w-10 h-10 rounded-xl bg-teal-500 text-white text-xl">🤟</span>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-2xl text-gray-900">
              KamAI
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/assets/logo.png" alt="KamAI" className="h-9 w-auto"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
            <span style={{ display:'none', fontFamily: 'var(--font-display)' }} className="font-bold text-2xl">🤟 KamAI</span>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <h1 style={{ fontFamily: 'var(--font-display)' }}
              className="font-bold text-2xl sm:text-3xl text-gray-900 text-center mb-8">
              Sign In
            </h1>

            {/* Email */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                  placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Password */}
            <div className="mb-2 relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                  placeholder:text-gray-400 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>

            <div className="text-right mb-5">
              <a href="#" className="text-xs text-teal-600 hover:underline">Forgot password?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-shimmer text-white font-semibold py-3 rounded-xl text-sm mb-5 transition-all disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login to KamAI'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                border border-gray-200 text-sm font-medium text-gray-700
                hover:bg-gray-50 hover:border-gray-300 transition-all mb-6 disabled:opacity-60">
              <GoogleIcon />
              Google
            </button>

            {/* Legal */}
            <p className="text-center text-xs text-gray-400 mb-4">
              By clicking continue, you agree to our{' '}
              <a href="#" className="text-teal-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>
            </p>

            {/* Sign up link */}
            <div className="border-t border-gray-100 pt-4 text-center">
              <span className="text-sm text-gray-500">Don't have an account? </span>
              <a href="/signup" className="text-sm font-semibold text-teal-600 hover:underline">Sign Up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}