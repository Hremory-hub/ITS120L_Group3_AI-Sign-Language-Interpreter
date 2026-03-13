import { useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getStats, getSessions, getMySubscription } from '../api'
import CheckoutModal from '../components/CheckoutModal'
import { navigate } from '../utils/navigate'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FEATURES = [
  {
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>,
    bg: 'bg-orange-100 text-orange-500', title: 'Sign To Text',
    desc: 'Real-time conversion of hand gestures into readable text.',
    href: '/session/sign-to-text', badge: 'Live', badgeColor: 'bg-orange-100 text-orange-600',
  },
  {
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    bg: 'bg-teal-100 text-teal-500', title: 'Speech to Sign',
    desc: 'Converts spoken words into on-screen sign language animations.',
    href: '/session/speech-to-sign', badge: 'Coming Soon', badgeColor: 'bg-teal-100 text-teal-600',
  },
  {
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    bg: 'bg-yellow-100 text-yellow-500', title: 'Custom Vocabulary',
    desc: 'Build a personal sign dictionary for your classroom.',
    href: '/session/vocabulary', badge: 'New', badgeColor: 'bg-yellow-100 text-yellow-700',
  },
]

function StatPill({ label, value, loading }) {
  return (
    <div className="text-center">
      {loading
        ? <div className="h-8 w-14 bg-teal-400/40 rounded-lg animate-pulse mx-auto mb-1" />
        : <p style={{ fontFamily:'var(--font-display)' }} className="font-black text-2xl sm:text-3xl text-white">{value ?? '—'}</p>
      }
      <p className="text-teal-200 text-xs font-medium">{label}</p>
    </div>
  )
}

function SessionTable({ sessions, loading }) {
  if (loading) return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
        {['Feature','Date','Duration','Status'].map(h =>
          <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>)}
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="grid grid-cols-4 px-5 py-4 gap-4 border-b border-gray-100 last:border-0">
          {[1,2,3,4].map(j => <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ))}
    </div>
  )

  if (!sessions?.length) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
      <span className="text-4xl mb-3 block">🎬</span>
      <p className="text-gray-500 text-sm font-medium">No sessions yet.</p>
      <p className="text-gray-400 text-xs mt-1">Launch a feature above to start your first session.</p>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
        {['Feature','Date','Duration','Status'].map(h =>
          <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>)}
      </div>
      {sessions.map((s, i) => (
        <div key={s.id ?? i}
          className={`grid grid-cols-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors
            ${i < sessions.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <span className="text-sm font-semibold text-gray-800">{s.feature}</span>
          <span className="text-sm text-gray-500">
            {s.started_at ? new Date(s.started_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—'}
          </span>
          <span className="text-sm text-gray-500">
            {s.duration_minutes != null ? `${s.duration_minutes} min` : '—'}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit
            ${s.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'completed' ? 'bg-green-500' : 'bg-amber-400'}`}/>
            {s.status ?? 'active'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [authUser,     setAuthUser]     = useState(null)
  const [loadingAuth,  setLoadingAuth]  = useState(true)
  const [stats,        setStats]        = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [sessions,     setSessions]     = useState([])
  const [loadingSess,  setLoadingSess]  = useState(false)
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [activeTab,    setActiveTab]    = useState('overview')
  const [filter,       setFilter]       = useState('All')
  const [sub,          setSub]          = useState(null)
  const [checkoutModal,setCheckoutModal] = useState(null)

  const PER_PAGE = 10

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setAuthUser(u); setLoadingAuth(false) })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authUser) return
    // Subscription tier
    getMySubscription().then(setSub).catch(() => {})
    // Stats
    setLoadingStats(true)
    getStats().then(setStats).catch(e => console.warn('Stats:', e.message)).finally(() => setLoadingStats(false))
    // Sessions
    fetchPage(1)
  }, [authUser])

  const fetchPage = p => {
    setLoadingSess(true)
    getSessions(p, PER_PAGE)
      .then(({ sessions: rows, total: t }) => { setSessions(rows); setTotal(t); setPage(p) })
      .catch(e => console.warn('Sessions:', e.message))
      .finally(() => setLoadingSess(false))
  }

  const greeting = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening' }
  const name     = authUser?.displayName || authUser?.email?.split('@')[0] || 'there'
  const totalPages = Math.ceil(total / PER_PAGE)
  const filtered   = filter === 'All' ? sessions : sessions.filter(s => s.feature === filter)

  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
    </div>
  )

  if (!authUser) return (
    <div className="min-h-screen flex flex-col">
      <Navbar activePage="/dashboard" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">🔒</span>
        <h2 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-2xl text-gray-900">
          Sign in to access your dashboard
        </h2>
        <a href="/signin" className="btn-shimmer text-white font-semibold px-6 py-3 rounded-xl text-sm">Sign In</a>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar activePage="/dashboard" />

      {/* ── Hero ── */}
      <div className="bg-teal-500 relative overflow-hidden pt-14 sm:pt-16">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize:'32px 32px' }} />
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-teal-400 opacity-30 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-teal-200 text-sm font-medium mb-1">{greeting()},</p>
            <h1 style={{ fontFamily:'var(--font-display)' }} className="font-black text-3xl sm:text-4xl text-white mb-2 capitalize">
              {name} 👋
            </h1>
            <p className="text-teal-100 text-sm">Ready to start interpreting?</p>
            {/* Tier badge */}
            <div className="flex items-center gap-2 mt-3">
              {sub ? (
                <>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                    ${sub.tier === 'enterprise'   ? 'bg-violet-400/30 text-violet-100 border border-violet-300/40' :
                      sub.tier === 'professional' ? 'bg-teal-300/30 text-teal-100 border border-teal-300/40' :
                                                    'bg-white/10 text-teal-200 border border-white/20'}`}>
                    {sub.tier ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) : 'Free'} Plan
                  </span>
                  {sub.tier === 'free' && (
                    <button
                      onClick={() => setCheckoutModal({ tier: 'professional', period: 'monthly' })}
                      className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors underline underline-offset-2">
                      Upgrade →
                    </button>
                  )}
                </>
              ) : (
                <span className="text-xs text-teal-300">Loading plan…</span>
              )}
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <StatPill label="Sessions" value={stats?.total_sessions} loading={loadingStats} />
            <StatPill label="Minutes"  value={stats?.total_minutes}  loading={loadingStats} />
            <StatPill label="Words"    value={stats?.total_words != null ? `${stats.total_words.toLocaleString()} words` : null} loading={loadingStats} />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pt-2">
          {[{id:'overview',label:'Overview'},{id:'sessions',label:'My Sessions'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all
                ${activeTab===tab.id ? 'bg-gray-50 text-teal-600' : 'text-teal-200 hover:text-white hover:bg-teal-600/40'}`}>
              {tab.label}
              {tab.id==='sessions' && total > 0 && (
                <span className="ml-2 text-xs bg-teal-400/50 px-1.5 py-0.5 rounded-full">{total}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">

        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Feature cards */}
            <div>
              <h2 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-xl sm:text-2xl text-gray-900 mb-1">KamAI Features</h2>
              <p className="text-gray-400 text-sm mb-5">Choose a tool to start a new session</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map(f => (
                  <a key={f.title} href={f.href}
                    className="group bg-white rounded-2xl p-6 border border-gray-200
                      hover:border-teal-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                    <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-5
                      group-hover:scale-110 transition-transform duration-200`}>{f.icon}</div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-lg text-gray-900">{f.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.badgeColor}`}>{f.badge}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{f.desc}</p>
                    <div className="flex items-center text-teal-500 text-sm font-semibold gap-1 group-hover:gap-2 transition-all">
                      Launch <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent sessions */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-xl sm:text-2xl text-gray-900">Recent Sessions</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Your latest interpreting activity</p>
                </div>
                <button onClick={() => setActiveTab('sessions')}
                  className="text-sm text-teal-500 font-semibold hover:text-teal-600">View all →</button>
              </div>
              <SessionTable sessions={sessions.slice(0,3)} loading={loadingSess} />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-xl sm:text-2xl text-gray-900">All Sessions</h2>
                <p className="text-gray-400 text-sm mt-0.5">{total} total sessions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All','Sign To Text','Speech to Sign','Custom Vocabulary'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                      ${filter===f ? 'border-teal-500 text-teal-600 bg-teal-50' : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <SessionTable sessions={filtered} loading={loadingSess} />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => fetchPage(page-1)} disabled={page<=1||loadingSess}
                  className="px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl
                    hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  ← Prev
                </button>
                <span className="text-sm text-gray-400 px-2">Page {page} of {totalPages}</span>
                <button onClick={() => fetchPage(page+1)} disabled={page>=totalPages||loadingSess}
                  className="px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl
                    hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {checkoutModal && (
        <CheckoutModal
          tier={checkoutModal.tier}
          period={checkoutModal.period}
          onClose={() => setCheckoutModal(null)}
          onSuccess={async () => {
            setCheckoutModal(null)
            try { setSub(await getMySubscription()) } catch {}
          }}
        />
      )}
    </div>
  )
}
