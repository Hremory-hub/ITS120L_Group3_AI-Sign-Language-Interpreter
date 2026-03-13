import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const STEPS = [
  {
    number: '01',
    title: 'Point Your Camera',
    body: 'Open KamAI on any device with a camera. No installation needed, it runs entirely in your browser.',
    icon: '📷',
  },
  {
    number: '02',
    title: 'AI Detects Gestures',
    body: 'Our model analyzes hand shape, position, and movement 30 times per second to identify signs.',
    icon: '🧠',
  },
  {
    number: '03',
    title: 'Instant Translation',
    body: 'Recognized signs are translated into text on screen and optionally read aloud via text-to-speech in under 200ms.',
    icon: '⚡',
  },
  {
    number: '04',
    title: 'Copy & Share',
    body: 'Full session transcripts are saved automatically. You can copy your transcripts and share with your peers.',
    icon: '📤',
  },
]

export default function AboutHowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activePage="/about/how-it-works" />

      {/* Teal accent bar */}
      <div className="h-2 bg-teal-500 mt-14 sm:mt-16" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        <h1 style={{ fontFamily: 'var(--font-display)' }}
          className="font-black text-4xl sm:text-5xl text-gray-900 mb-4">
          How It Works
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-12 max-w-xl">
          From camera to classroom, here's how KamAI turns hand gestures into words in real time.
        </p>

        {/* Step timeline */}
        <div className="relative">
          {/* Vertical line — desktop only */}
          <div className="hidden sm:block absolute left-8 top-4 bottom-4 w-px bg-teal-100" />

          <div className="space-y-8 sm:space-y-10">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative flex gap-6 items-start">
                {/* Step circle */}
                <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-teal-500 flex flex-col
                  items-center justify-center shadow-lg shadow-teal-200 text-white">
                  <span className="text-xl leading-none">{step.icon}</span>
                  <span className="text-xs font-bold opacity-80 mt-0.5">{step.number}</span>
                </div>
                {/* Content */}
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6
                  hover:border-teal-200 hover:shadow-md transition-all">
                  <h3 style={{ fontFamily: 'var(--font-display)' }}
                    className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-teal-50 border border-teal-100 rounded-2xl p-8 text-center">
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="font-bold text-2xl text-gray-900 mb-3">
            Ready to try it yourself?
          </h2>
          <p className="text-gray-500 text-sm mb-6">No credit card required. Start interpreting in seconds.</p>
          <a href="/signup"
            className="inline-flex items-center gap-2 btn-shimmer text-white font-semibold
              px-8 py-3.5 rounded-xl text-sm">
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
