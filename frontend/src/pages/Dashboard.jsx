import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const MOCK_USER = { displayName: 'Donny Savage', role: 'Faculty' }

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
      </svg>
    ),
    bg: 'bg-orange-100 text-orange-500',
    title: 'Sign To Text',
    desc: 'Real-time conversion of hand gestures into readable text. Perfect for capturing everything said in class.',
    href: '/session/sign-to-text',
    badge: 'Live',
    badgeColor: 'bg-orange-100 text-orange-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    bg: 'bg-teal-100 text-teal-500',
    title: 'Speech to Sign',
    desc: 'Converts spoken words into on-screen sign language animations — bridging verbal and visual communication.',
    href: '/session/speech-to-sign',
    badge: 'Live',
    badgeColor: 'bg-teal-100 text-teal-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    ),
    bg: 'bg-yellow-100 text-yellow-500',
    title: 'Custom Vocabulary',
    desc: 'Build and manage a personal sign dictionary tailored to your classroom subjects and student needs.',
    href: '/session/vocabulary',
    badge: 'New',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
]

const RECENT_SESSIONS = [
  { id: 1, feature: 'Sign To Text',       date: 'Feb 21, 2026', duration: '24 min', status: 'completed' },
  { id: 2, feature: 'Speech to Sign',     date: 'Feb 20, 2026', duration: '41 min', status: 'completed' },
  { id: 3, feature: 'Custom Vocabulary',  date: 'Feb 18, 2026', duration: '12 min', status: 'completed' },
  { id: 4, feature: 'Sign To Text',       date: 'Feb 17, 2026', duration: '33 min', status: 'completed' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'sessions'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar activePage="/dashboard" />

      {/* ── Hero Banner ── */}
      <div className="bg-teal-500 relative overflow-hidden pt-14 sm:pt-16">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        {/* Blob */}
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-teal-400 opacity-30 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-teal-200 text-sm font-medium mb-1">{greeting()},</p>
            <h1 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-3xl sm:text-4xl text-white mb-2">
              {MOCK_USER.displayName} 👋
            </h1>
            <p className="text-teal-100 text-sm">
              {MOCK_USER.role} · Ready to start interpreting?
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 sm:gap-6">
            {[
              { label: 'Sessions', value: '24' },
              { label: 'Hours',    value: '18.4' },
              { label: 'Words',    value: '3.2k' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: 'var(--font-display)' }}
                  className="font-black text-2xl sm:text-3xl text-white">{s.value}</p>
                <p className="text-teal-200 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pt-2">
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'sessions',  label: 'My Sessions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all
                ${activeTab === tab.id
                  ? 'bg-gray-50 text-teal-600'
                  : 'text-teal-200 hover:text-white hover:bg-teal-600/40'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">

        {activeTab === 'overview' && (
          <div className="space-y-10">

            {/* Features section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)' }}
                    className="font-bold text-xl sm:text-2xl text-gray-900">KamAI Features</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Choose a tool to start a new session</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map(f => (
                  <a key={f.title} href={f.href}
                    className="group bg-white rounded-2xl p-6 border border-gray-200
                      hover:border-teal-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-5
                      group-hover:scale-110 transition-transform duration-200`}>
                      {f.icon}
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 style={{ fontFamily: 'var(--font-display)' }}
                        className="font-bold text-lg text-gray-900">{f.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.badgeColor}`}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex items-center text-teal-500 text-sm font-semibold gap-1
                      group-hover:gap-2 transition-all">
                      Launch
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent sessions preview */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)' }}
                    className="font-bold text-xl sm:text-2xl text-gray-900">Recent Sessions</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Your latest interpreting activity</p>
                </div>
                <button onClick={() => setActiveTab('sessions')}
                  className="text-sm text-teal-500 font-semibold hover:text-teal-600 transition-colors">
                  View all →
                </button>
              </div>
              <SessionTable sessions={RECENT_SESSIONS.slice(0, 3)} />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)' }}
                  className="font-bold text-xl sm:text-2xl text-gray-900">All Sessions</h2>
                <p className="text-gray-400 text-sm mt-0.5">{RECENT_SESSIONS.length} total sessions</p>
              </div>
              {/* Filter chips */}
              <div className="flex gap-2">
                {['All', 'Sign To Text', 'Speech to Sign'].map(f => (
                  <button key={f}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200
                      hover:border-teal-400 hover:text-teal-600 transition-colors text-gray-600">
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <SessionTable sessions={RECENT_SESSIONS} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function SessionTable({ sessions }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
        {['Feature', 'Date', 'Duration', 'Status'].map(h => (
          <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>
        ))}
      </div>
      {/* Rows */}
      {sessions.map((s, i) => (
        <div key={s.id}
          className={`grid grid-cols-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors
            ${i < sessions.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <span className="text-sm font-semibold text-gray-800">{s.feature}</span>
          <span className="text-sm text-gray-500">{s.date}</span>
          <span className="text-sm text-gray-500">{s.duration}</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {s.status}
          </span>
        </div>
      ))}
    </div>
  )
}
