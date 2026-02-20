import { useEffect, useRef, useState } from 'react'

function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function StatCard({ value, suffix = '', label, animate, delay }) {
  const count = useCounter(value, 1600, animate)
  return (
    <div className="stat-pill pl-3 sm:pl-4" style={{ animationDelay: delay }}>
      <p className="text-teal-500 text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {animate ? count : 0}{suffix}
      </p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function Hero() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t) }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-14 sm:pt-16">

      {/* Background blobs */}
      <div className="absolute -top-32 -left-32 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-teal-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-teal-50 rounded-full blur-2xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-12 md:py-0">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ── LEFT: Copy ── */}
          <div className="space-y-6 sm:space-y-8 text-center md:text-left order-2 md:order-1">

            {/* Badge */}
            <div className={`inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full
              px-3 sm:px-4 py-1.5 text-xs font-semibold text-teal-700
              ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-0`}>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulseRing" />
              AI-Powered Sign Language Interpreter
            </div>

            {/* Headline */}
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className={`font-black text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl
                leading-[1.05] tracking-tight text-gray-900
                ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-100`}
            >
              When Hands{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-teal-500">Speak,</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                  <path d="M0 3 Q25 0 50 3 Q75 6 100 3 Q125 0 150 3 Q175 6 200 3"
                    stroke="#2AABAC" strokeWidth="2.5" fill="none" opacity="0.5"/>
                </svg>
              </span>
              <br />
              Everyone{' '}
              <span className="italic font-bold text-gray-700">Listens</span>
            </h1>

            {/* Sub */}
            <p className={`text-gray-500 text-base sm:text-lg leading-relaxed max-w-sm mx-auto md:mx-0
              ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-200`}>
              An AI-powered sign language interpreter for{' '}
              <span className="text-gray-700 font-semibold">inclusive education</span>.
              Bridging communication gaps in real time.
            </p>

            {/* CTA */}
            <div className={`flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4
              ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-300`}>
              <a href="#" className="btn-shimmer w-full sm:w-auto text-white font-semibold text-base
                px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-3 group">
                Start Interpreting
                <span className="group-hover:translate-x-1 transition-transform duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </a>
              <a href="#features"
                className="group flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-500 transition-colors">
                <span className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200
                  group-hover:border-teal-400 group-hover:bg-teal-50 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
                See how it works
              </a>
            </div>

            {/* Stats placeholder and shit */}
            <div className={`flex flex-wrap justify-center md:justify-start gap-6 sm:gap-8 pt-2
              ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-400`}>
              <StatCard value={100} suffix="+" label="Students Reached" animate={visible} delay="400ms" />
              <StatCard value={95}    suffix="%" label="Accuracy Rate"    animate={visible} delay="500ms" />
            </div>
          </div>

          {/* ── RIGHT: Image ── */}
          <div className={`relative order-1 md:order-2 ${visible ? 'animate-fadeUp' : 'opacity-0'} delay-200`}>

            {/* Decorative rings — hide on small screens */}
            <div className="hidden sm:block absolute -top-6 -right-6 w-56 md:w-72 h-56 md:h-72
              rounded-full border-2 border-dashed border-teal-200 animate-float opacity-60 pointer-events-none" />
            <div className="hidden sm:block absolute -bottom-4 -left-4 w-32 md:w-40 h-32 md:h-40
              rounded-full border border-teal-300 opacity-30 pointer-events-none" />

            {/* Main image */}
            <div className="relative hero-clip overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=900&q=80" // no need lagay pic sa assets 
                alt="Children learning sign language in an inclusive classroom"
                className="w-full h-56 xs:h-72 sm:h-80 md:h-[420px] lg:h-[500px] xl:h-[540px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent pointer-events-none" />
            </div>

            {/* Floating: Live card — hidden on xs, shown sm+ */}
            <div className="hidden sm:block absolute bottom-6 md:bottom-8 -left-4 md:-left-8
              glass-card rounded-2xl px-4 py-3 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white text-base">🤟</div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Live Interpreting</p>
                  <p className="text-xs text-teal-600 font-medium">● Active session</p>
                </div>
              </div>
            </div>

            {/* Floating: Confidence chip */}
            <div className="hidden sm:block absolute top-6 md:top-8 -left-3 md:-left-6
              glass-card rounded-xl px-3 py-2.5 shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
              <p className="text-xs text-gray-500 font-medium">Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[97%] bg-teal-400 rounded-full" />
                </div>
                <span className="text-xs font-bold text-teal-600">97%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1 opacity-40">
        <span className="text-xs text-gray-400 font-medium">Scroll</span>
        <svg className="w-4 h-4 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
