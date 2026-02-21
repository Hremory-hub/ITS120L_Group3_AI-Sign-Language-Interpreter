import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Help() {
  const [feedback, setFeedback] = useState({ title: '', thoughts: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!feedback.title.trim() || !feedback.thoughts.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFeedback({ title: '', thoughts: '' })
    }, 3000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar activePage="/help" />

      <main className="flex-1 pt-14 sm:pt-16">
        {/* Hero header */}
        <div className="bg-gradient-to-b from-teal-50 to-white py-14 sm:py-20 text-center px-4">
          <h1 style={{ fontFamily: 'var(--font-display)' }}
            className="font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-3">
            How can we <span className="text-teal-500">Help?</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto">
            We're here for you — reach out or share your thoughts to help us improve.
          </p>
        </div>

        {/* Cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          {/* Contact Support */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
            {/* Envelope icon */}
            <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)' }}
              className="font-bold text-2xl text-gray-900 mb-2">Contact Support</h2>
            <p className="text-gray-500 text-sm mb-8">
              Reach out to our support team for personalized assistance.
            </p>

            <div className="w-full space-y-3 mb-8">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span className="text-sm text-gray-700">support@kamai.com</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span className="text-sm text-gray-700">+63 XXXXXXXXX</span>
              </div>
            </div>

            <a href="mailto:support@kamai.com"
              className="w-full btn-shimmer text-white font-semibold py-3.5 rounded-2xl text-sm text-center block">
              Contact Us
            </a>
          </div>

          {/* Feedback & Suggestions */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
            {/* Chat/edit icon */}
            <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)' }}
              className="font-bold text-2xl text-gray-900 mb-2">Feedback & Suggestions</h2>
            <p className="text-gray-500 text-sm mb-6">
              Share your feedback and suggestions to improve KamAI.
            </p>

            <div className="w-full space-y-3 mb-6 text-left">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={feedback.title}
                  onChange={e => setFeedback(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                    placeholder:text-gray-400 transition-all"
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Your Thoughts"
                  value={feedback.thoughts}
                  onChange={e => setFeedback(f => ({ ...f, thoughts: e.target.value }))}
                  className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                    placeholder:text-gray-400 transition-all resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full font-semibold py-3.5 rounded-2xl text-sm transition-all
                ${submitted
                  ? 'bg-green-500 text-white'
                  : 'btn-shimmer text-white'}`}
            >
              {submitted ? '✓ Submitted! Thank you' : 'Save'}
            </button>
          </div>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="font-bold text-2xl text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: 'What sign languages does KamAI support?', a: 'KamAI currently supports Filipino Sign Language (FSL) and American Sign Language (ASL).' },
              { q: 'Does KamAI work offline?', a: 'KamAI requires an internet connection for full AI processing. A limited offline mode is in development.' },
              { q: 'Is my video data stored?', a: 'No. All video processing happens in real time and no footage is ever stored or uploaded to our servers.' },
              { q: 'Can I use KamAI on a mobile device?', a: 'Yes! KamAI is fully browser-based and works on any device with a front-facing camera.' },
            ].map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}
