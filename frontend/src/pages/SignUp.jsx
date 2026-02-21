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

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-gray-50">
        {/*container */}
        <div className="relative w-[80%] h-[70%] select-none flex items-center justify-center select-none">
            
            {/* Back card*/}
              <div className="absolute inset-1 rounded-3xl bg-teal-200/60 rotate-3 translate-x-1 translate-y-2 z-0" /> 
            {/* Pic*/} 
            <div className="rounded-3xl overflow-hidden shadow-2xl z-10" style={{ left: '25%', top: '10%', width: '90%', height: '70%' }}> 
              <img src="https://images.pexels.com/photos/8422142/pexels-photo-8422142.jpeg?_gl=1*prjyo3*_ga*OTI5NjI5NjAxLjE3NzAzNzIyMzA.*_ga_
              8JE65Q40S6*czE3NzE2NjA3ODEkbzIkZzEkdDE3NzE2NjA4ODMkajYwJGwwJGgw"
               alt="mga batang nag gagang sign" 
               className="w-full h-full object-cover select-none" 
             /> 
            </div>

          {/* KamAI wordmark */}
          <div className="absolute bottom-7 left-12 flex items-center gap-3">
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
