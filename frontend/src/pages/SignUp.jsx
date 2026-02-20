import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignUp() {
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: ''
  })
  const [showPass, setShowPass] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left panel: decorative hands illustration ── */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-white">
        {/* Large hand blobs — matching Figma art direction */}
        <div className="relative w-full h-full flex items-center justify-center select-none">
          {/* Big back hand */}
          <div className="absolute" style={{ left: '5%', top: '10%', width: '65%', height: '70%' }}>
            <svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
              <path d="M60 340 C20 300 10 220 30 160 C50 100 80 60 110 40 C130 28 150 30 160 50 C170 70 165 100 150 120 C180 90 210 70 230 80 C255 92 258 130 240 160 C260 140 285 138 295 158 C308 182 295 220 270 245 C280 235 295 240 298 260 C302 285 282 315 255 330 C230 344 190 350 155 348 C120 346 85 355 60 340Z" fill="#2AABAC" fillOpacity="0.85"/>
              {/* Texture dots */}
              {[...Array(30)].map((_, i) => (
                <circle key={i} cx={80 + (i % 6) * 30 + Math.sin(i) * 10} cy={100 + Math.floor(i/6) * 40 + Math.cos(i*2)*8} r="3" fill="white" fillOpacity="0.25"/>
              ))}
            </svg>
          </div>
          {/* Smaller front hand */}
          <div className="absolute" style={{ right: '5%', bottom: '12%', width: '45%', height: '50%' }}>
            <svg viewBox="0 0 240 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-75">
              <path d="M50 270 C20 240 15 175 30 125 C45 75 70 45 95 30 C115 18 132 22 140 42 C148 60 142 88 128 105 C152 78 178 60 196 68 C218 78 220 112 204 138 C220 120 240 118 248 136 C258 158 246 192 224 214 C212 205 220 218 222 234 C225 256 208 278 186 290 C164 302 132 306 105 304 C78 302 62 284 50 270Z" fill="#2AABAC" fillOpacity="0.55"/>
              {[...Array(15)].map((_, i) => (
                <circle key={i} cx={70 + (i % 4) * 28 + Math.sin(i)*8} cy={80 + Math.floor(i/4) * 45} r="2.5" fill="white" fillOpacity="0.3"/>
              ))}
            </svg>
          </div>

          {/* KamAI wordmark */}
          <div className="absolute bottom-12 left-12 flex items-center gap-3">
            <img src="/assets/logo.png" alt="KamAI" className="h-12 w-auto"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
            <span style={{ display:'none', fontFamily: 'var(--font-display)' }} className="font-bold text-3xl text-gray-900">🤟</span>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-black text-4xl text-gray-900">KamAI</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/assets/logo.png" alt="KamAI" className="h-9 w-auto"
              onError={e => e.target.style.display='none'} />
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-2xl">
              Kam<span className="text-teal-500">AI</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <h1 style={{ fontFamily: 'var(--font-display)' }}
              className="font-bold text-2xl sm:text-3xl text-gray-900 text-center mb-7">
              Create an account
            </h1>

            {/* Google */}
            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl
              border border-gray-200 text-sm font-medium text-gray-700
              hover:bg-gray-50 hover:border-gray-300 transition-all mb-6">
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Or divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm font-medium text-gray-500">Or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Fields */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email or Phone</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                    placeholder:text-gray-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                      placeholder:text-gray-400 transition-all pr-11"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={set('lastName')}
                    className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button className="w-full btn-shimmer text-white font-semibold py-3.5 rounded-xl text-sm mb-5">
              Create Account
            </button>

            {/* Already have account */}
            <div className="text-center">
              <span className="text-sm text-gray-500">Already have an account? </span>
              <a href="/signin" className="text-sm font-semibold text-teal-600 hover:underline">Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
