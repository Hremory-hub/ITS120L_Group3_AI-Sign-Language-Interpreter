/**
 * /session/vocabulary — Custom Vocabulary Manager
 *
 * Access: Professional and Enterprise only.
 * Free users see an upgrade paywall.
 *
 * Tier = word frequency weight, same scale as the global corpus:
 *   Tier 1 → weight 100  (most prominent — like "hello", "school")
 *   Tier 2 → weight 60   (common)
 *   Tier 3 → weight 20   (least prominent — still above all global words at same tier)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  getVocab, addVocabWord, updateVocabWord, deleteVocabWord,
  getMySubscription, markVocabUsed
} from '../api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CheckoutModal from '../components/CheckoutModal'

// ── Tier config ───────────────────────────────────────────────────────────────
const TIERS = {
  p1: {
    key: 'p1', label: 'Tier 1', weight: 100,
    desc: 'Most prominent — surfaces like everyday words',
    color: 'bg-teal-100 text-teal-700',
    dot: 'bg-teal-500', border: 'border-teal-400', ring: 'ring-teal-300',
    badge: 'bg-teal-500',
  },
  p2: {
    key: 'p2', label: 'Tier 2', weight: 60,
    desc: 'Common — appears regularly in suggestions',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400', border: 'border-amber-400', ring: 'ring-amber-300',
    badge: 'bg-amber-400',
  },
  p3: {
    key: 'p3', label: 'Tier 3', weight: 20,
    desc: 'Low — appears when prefix matches closely',
    color: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400', border: 'border-gray-300', ring: 'ring-gray-200',
    badge: 'bg-gray-400',
  },
}
const TIER_KEYS = ['p1', 'p2', 'p3']

function TierBadge({ tier }) {
  const t = TIERS[tier] || TIERS.p3
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
      rounded-full px-2.5 py-1 ${t.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
      {t.label}
    </span>
  )
}

// ── Upgrade wall (free users) ─────────────────────────────────────────────────
function UpgradeWall({ onUpgrade }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
      </div>

      <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700
        text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Professional Feature
      </span>

      <h2 style={{ fontFamily: 'var(--font-display)' }}
        className="font-black text-3xl text-gray-900 mb-3">Custom Vocabulary</h2>
      <p className="text-gray-500 text-sm max-w-md mb-2 leading-relaxed">
        Add words that don't appear in the default autocomplete — like <span className="font-mono font-semibold
        text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">entanglement</span>, names, or subject-specific terms.
      </p>
      <p className="text-gray-400 text-xs max-w-sm mb-8">
        Set each word's Tier to control how prominently it surfaces in Sign-to-Text suggestions — using the same weight scale as the built-in word corpus.
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mb-8 w-full">
        {[
          { tier: 'p1', example: '"entanglement"', note: 'Tier 1 → surfaces like common words' },
          { tier: 'p2', example: '"photosynthesis"', note: 'Tier 2 → appears regularly' },
          { tier: 'p3', example: '"mitochondria"', note: 'Tier 3 → appears when matched closely' },
        ].map(f => (
          <div key={f.tier} className="bg-white border border-gray-200 rounded-2xl p-3 text-left">
            <TierBadge tier={f.tier} />
            <p className="text-xs font-mono font-semibold text-gray-700 mt-2 mb-1">{f.example}</p>
            <p className="text-[10px] text-gray-400 leading-snug">{f.note}</p>
          </div>
        ))}
      </div>

      <button onClick={onUpgrade}
        className="btn-shimmer text-white font-bold px-8 py-3.5 rounded-xl text-sm
          flex items-center gap-2 mx-auto">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Upgrade to Professional
      </button>
    </div>
  )
}

// ── Word Form Modal ───────────────────────────────────────────────────────────
function WordModal({ word = null, onSave, onClose }) {
  const isEdit = !!word
  const [form, setForm] = useState({
    word:       word?.word       ?? '',
    definition: word?.definition ?? '',
    tags:       word?.tags       ?? '',
    tier:       word?.tier       ?? 'p3',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    const w = form.word.trim()
    if (!w) { setError('Word is required.'); return }
    setSaving(true)
    try {
      await onSave({
        word:       w.toLowerCase(),
        definition: form.definition.trim() || null,
        tags:       form.tags.trim()       || null,
        tier:       form.tier,
      })
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30
              flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">
            {isEdit ? 'Edit Word' : 'New Word'}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="font-black text-2xl text-white">
            {isEdit ? `"${word.word}"` : 'Add to Vocabulary'}
          </h2>
        </div>

        <div className="px-8 py-6 space-y-5">

          {/* Word */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Word <span className="text-red-400">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={form.word}
              onChange={set('word')}
              placeholder="e.g. entanglement"
              maxLength={120}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all
                font-mono text-gray-900 placeholder:text-gray-300 placeholder:font-sans"
            />
          </div>

          {/* Definition */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Definition <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={form.definition}
              onChange={set('definition')}
              rows={2}
              placeholder="e.g. A quantum physics term for correlated particles"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all
                resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Tags <span className="text-gray-300 font-normal normal-case">(comma-separated, optional)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={set('tags')}
              placeholder="e.g. science, physics, classroom"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all
                placeholder:text-gray-300"
            />
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-gray-100 text-gray-500
                    px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Tier selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Suggestion Tier
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Controls how prominently this word appears in autocomplete — same weight scale as the built-in word corpus.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIER_KEYS.map(key => {
                const t      = TIERS[key]
                const active = form.tier === key
                return (
                  <button key={key} type="button"
                    onClick={() => setForm(f => ({ ...f, tier: key }))}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all
                      ${active
                        ? `${t.border} bg-white ring-2 ${t.ring} shadow-sm`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                    <span className={`w-2.5 h-2.5 rounded-full inline-block mb-2 ${t.dot}`} />
                    <p className="text-xs font-black text-gray-900">{t.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">weight {t.weight}</p>
                    <p className="text-[10px] text-gray-300 mt-1 leading-snug">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200
                rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving || !form.word.trim()}
              className="flex-1 py-3 text-sm font-semibold text-white btn-shimmer rounded-xl
                flex items-center justify-center gap-2 disabled:opacity-50">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>
                : isEdit ? 'Save Changes' : 'Add Word'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Word Card ─────────────────────────────────────────────────────────────────
function WordCard({ word, onEdit, onDelete }) {
  const tags = word.tags ? word.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const t    = TIERS[word.tier] || TIERS.p3

  return (
    <div className={`bg-white border-2 rounded-2xl p-5 transition-all group
      hover:shadow-md border-gray-100 hover:${t.border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span style={{ fontFamily: 'var(--font-display)' }}
            className="font-black text-lg text-gray-900 leading-tight">
            {word.word}
          </span>
          <TierBadge tier={word.tier} />
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(word)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-teal-100 hover:text-teal-600
              flex items-center justify-center transition-colors text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(word)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500
              flex items-center justify-center transition-colors text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      {word.definition && (
        <p className="text-sm text-gray-500 mb-2.5 leading-relaxed line-clamp-2">{word.definition}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map(tag => (
          <span key={tag} className="text-[10px] font-semibold bg-gray-100 text-gray-500
            px-2 py-0.5 rounded-full">{tag}</span>
        ))}
        {word.use_count > 0 && (
          <span className="ml-auto text-[10px] text-gray-300 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Used {word.use_count}×
          </span>
        )}
      </div>
    </div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ word, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)' }}
          className="font-black text-xl text-gray-900 mb-2">Remove word?</h3>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-bold text-gray-700">"{word.word}"</span> will be removed and won't appear in autocomplete suggestions anymore.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200
              rounded-xl hover:bg-gray-50 transition-colors">Keep it</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
            disabled={loading}
            className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600
              rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Vocabulary() {
  const [user,        setUser]        = useState(undefined)
  const [sub,         setSub]         = useState(null)
  const [subLoading,  setSubLoading]  = useState(true)
  const [words,       setWords]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterTier,  setFilterTier]  = useState('')
  const [filterTag,   setFilterTag]   = useState('')
  const [modal,       setModal]       = useState(null)   // null | 'add' | { edit: word }
  const [deleteWord,  setDeleteWord]  = useState(null)
  const [toast,       setToast]       = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isPro = ['professional', 'enterprise'].includes(sub?.tier)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        try {
          const s = await getMySubscription()
          setSub(s)
        } catch {}
        setSubLoading(false)
      } else {
        setSubLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const fetchWords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)     params.set('q',    search)
      if (filterTier) params.set('tier', filterTier)
      if (filterTag)  params.set('tag',  filterTag)
      setWords(await getVocab(params.toString()))
    } catch (e) {
      showToast('Failed to load vocabulary.', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, filterTier, filterTag])

  useEffect(() => {
    if (isPro) fetchWords()
  }, [isPro, fetchWords])

  const allTags = [...new Set(
    words.flatMap(w => w.tags ? w.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
  )].sort()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const handleAdd    = async p => { await addVocabWord(p);              showToast(`"${p.word}" added!`);   fetchWords() }
  const handleEdit   = async p => { await updateVocabWord(modal.edit.id, p); showToast(`"${p.word}" updated.`); fetchWords() }
  const handleDelete = async () => { await deleteVocabWord(deleteWord.id); showToast(`"${deleteWord.word}" removed.`, 'error'); setDeleteWord(null); fetchWords() }

  // ── Loading ──
  if (user === undefined || subLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"/>
    </div>
  )

  // ── Not signed in ──
  if (!user) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">🔒</span>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-2xl text-gray-900">
          Sign in to manage your vocabulary
        </h2>
        <a href="/signin" className="btn-shimmer text-white font-semibold px-6 py-3 rounded-xl text-sm">Sign In</a>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar activePage="/session/vocabulary" />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 pt-14 sm:pt-16">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontFamily: 'var(--font-display)' }}
                  className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">
                  Custom Vocabulary
                </h1>
                {isPro && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold
                    bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Custom words appear first in Sign-to-Text autocomplete
              </p>
            </div>
          </div>

          {isPro && (
            <button onClick={() => setModal('add')}
              className="btn-shimmer text-white font-semibold text-sm px-4 py-2.5 rounded-xl
                flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Add Word
            </button>
          )}
        </div>
      </div>

      {/* ── Free user paywall ── */}
      {!isPro ? (
        <UpgradeWall onUpgrade={() => setShowUpgrade(true)} />
      ) : (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Words', value: words.length,                               color: 'text-gray-900' },
              { label: 'Tier 1',      value: words.filter(w => w.tier === 'p1').length,  color: 'text-teal-600' },
              { label: 'Tier 2',      value: words.filter(w => w.tier === 'p2').length,  color: 'text-amber-500' },
              { label: 'Tier 3',      value: words.filter(w => w.tier === 'p3').length,  color: 'text-gray-500' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                <p style={{ fontFamily: 'var(--font-display)' }}
                  className={`font-black text-2xl ${s.color}`}>{loading ? '–' : s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* How tiers work banner */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">How tiers work</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIER_KEYS.map(key => {
                const t = TIERS[key]
                return (
                  <div key={key} className={`rounded-xl p-3.5 ${t.color} border border-transparent`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${t.dot}`}/>
                      <span className="text-xs font-black">{t.label}</span>
                      <span className="text-[10px] font-mono font-bold opacity-60 ml-auto">weight {t.weight}</span>
                    </div>
                    <p className="text-xs opacity-75 leading-snug">{t.desc}</p>
                    <p className="text-[10px] opacity-50 mt-1">
                      {key === 'p1' && 'Same prominence as "hello", "school"'}
                      {key === 'p2' && 'Same prominence as "beautiful", "travel"'}
                      {key === 'p3' && 'Same prominence as "analyze", "integrate"'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search words or definitions…"
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/>
            </div>

            <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
              className="px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all text-gray-600 min-w-[130px]">
              <option value="">All tiers</option>
              {TIER_KEYS.map(k => <option key={k} value={k}>{TIERS[k].label}</option>)}
            </select>

            {allTags.length > 0 && (
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all text-gray-600 min-w-[130px]">
                <option value="">All tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            {(search || filterTier || filterTag) && (
              <button onClick={() => { setSearch(''); setFilterTier(''); setFilterTag('') }}
                className="px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200
                  rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Clear
              </button>
            )}
          </div>

          {/* Word grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 bg-gray-200 rounded-lg w-28"/>
                    <div className="h-5 bg-gray-100 rounded-full w-16"/>
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-full mb-1.5"/>
                  <div className="h-4 bg-gray-100 rounded w-2/3"/>
                </div>
              ))}
            </div>
          ) : words.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              {search || filterTier || filterTag ? (
                <>
                  <h3 style={{ fontFamily: 'var(--font-display)' }} className="font-black text-xl text-gray-900 mb-2">No words match</h3>
                  <p className="text-gray-400 text-sm mb-5">Try adjusting your filters.</p>
                  <button onClick={() => { setSearch(''); setFilterTier(''); setFilterTag('') }}
                    className="btn-shimmer text-white font-semibold px-5 py-2.5 rounded-xl text-sm">Clear Filters</button>
                </>
              ) : (
                <>
                  <h3 style={{ fontFamily: 'var(--font-display)' }} className="font-black text-xl text-gray-900 mb-2">No words yet</h3>
                  <p className="text-gray-400 text-sm mb-1 max-w-xs">
                    Add subject-specific terms, names, or any word not in the default dictionary.
                  </p>
                  <p className="text-gray-300 text-xs mb-6">They'll appear first when you're signing.</p>
                  <button onClick={() => setModal('add')}
                    className="btn-shimmer text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                      flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add your first word
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {words.map(w => (
                <WordCard key={w.id} word={w}
                  onEdit={w => setModal({ edit: w })}
                  onDelete={setDeleteWord} />
              ))}
              <button onClick={() => setModal('add')}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-5
                  flex flex-col items-center justify-center gap-2 text-gray-300
                  hover:border-teal-400 hover:text-teal-400 hover:bg-teal-50 transition-all min-h-[110px]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
                </svg>
                <span className="text-xs font-semibold">Add word</span>
              </button>
            </div>
          )}
        </main>
      )}

      <Footer />

      {/* Modals */}
      {(modal === 'add' || modal?.edit) && (
        <WordModal
          word={modal?.edit ?? null}
          onSave={modal?.edit ? handleEdit : handleAdd}
          onClose={() => setModal(null)} />
      )}
      {deleteWord && (
        <DeleteConfirm word={deleteWord} onConfirm={handleDelete} onClose={() => setDeleteWord(null)} />
      )}
      {showUpgrade && (
        <CheckoutModal
          tier="professional" billingPeriod="monthly"
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => { setShowUpgrade(false); window.location.reload() }} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]
          flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}>
          {toast.type === 'error'
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
