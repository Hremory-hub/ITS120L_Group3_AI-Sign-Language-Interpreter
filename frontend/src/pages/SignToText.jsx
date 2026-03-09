import { useState, useEffect, useRef, useCallback } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { createSession, updateSession, getSuggestions } from '../api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const API_BASE          = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const CAPTURE_INTERVAL   = 800
const MIN_CONFIDENCE     = 0.75
const REPEATS_TO_CONFIRM = 2
const SUGGEST_DEBOUNCE   = 320   // ms after last letter before fetching suggestions

export default function SignToText() {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const intervalRef = useRef(null)
  const streamRef   = useRef(null)
  const suggestTimer = useRef(null)

  const lastLetterRef   = useRef(null)
  const repeatCountRef  = useRef(0)
  const wordCountRef    = useRef(0)
  const sessionIdRef    = useRef(null)
  const sessionStartRef = useRef(null)

  const [user,        setUser]        = useState(null)
  const [camReady,    setCamReady]    = useState(false)
  const [camError,    setCamError]    = useState('')
  const [running,     setRunning]     = useState(false)
  const [predicting,  setPredicting]  = useState(false)

  const [currentLetter, setCurrentLetter] = useState(null)
  const [confidence,    setConfidence]    = useState(0)
  const [pendingWord,   setPendingWord]   = useState('')
  const [transcript,    setTranscript]    = useState([])
  const [elapsed,       setElapsed]       = useState(0)

  // ── Autocomplete state ────────────────────────────────────────────────────
  const [suggestions,     setSuggestions]     = useState([])
  const [suggestLoading,  setSuggestLoading]  = useState(false)
  const [selectedSuggest, setSelectedSuggest] = useState(-1)  // keyboard nav index

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  // Camera init
  useEffect(() => {
    initCamera()
    return () => teardownCamera()
  }, [])

  // Session timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setElapsed(sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
        : 0)
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  // ── Fetch suggestions whenever pendingWord changes ────────────────────────
  useEffect(() => {
    clearTimeout(suggestTimer.current)
    setSelectedSuggest(-1)

    if (pendingWord.length < 2) {
      setSuggestions([])
      return
    }

    setSuggestLoading(true)
    suggestTimer.current = setTimeout(async () => {
      try {
        const results = await getSuggestions(pendingWord, 6)
        // Filter out exact match — no point suggesting the word they already typed
        setSuggestions(results.filter(s => s !== pendingWord.toLowerCase()))
      } catch {
        setSuggestions([])
      } finally {
        setSuggestLoading(false)
      }
    }, SUGGEST_DEBOUNCE)

    return () => clearTimeout(suggestTimer.current)
  }, [pendingWord])

  const initCamera = async () => {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCamReady(true)
      }
    } catch (err) {
      setCamError(
        err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access and reload.' :
        err.name === 'NotFoundError'   ? 'No camera found. Please connect a webcam.' :
        `Camera error: ${err.message}`
      )
    }
  }

  const teardownCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(intervalRef.current)
    clearTimeout(suggestTimer.current)
  }

  const captureAndPredict = useCallback(async () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    setPredicting(true)
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) { setPredicting(false); return }
      const form = new FormData()
      form.append('file', blob, 'frame.jpg')

      try {
        const res = await fetch(`${API_BASE}/predict/`, { method: 'POST', body: form })
        if (!res.ok) throw new Error(res.status)
        const { letter, confidence: conf } = await res.json()

        setCurrentLetter(letter)
        setConfidence(conf)

        if (letter === 'None' || conf < MIN_CONFIDENCE) {
          lastLetterRef.current = null
          repeatCountRef.current = 0
        } else {
          if (letter === lastLetterRef.current) {
            repeatCountRef.current += 1
            if (repeatCountRef.current === REPEATS_TO_CONFIRM) {
              setPendingWord(w => w + letter)
              repeatCountRef.current = 0
            }
          } else {
            lastLetterRef.current = letter
            repeatCountRef.current = 1
          }
        }
      } catch (e) {
        console.error('Predict error:', e)
      } finally {
        setPredicting(false)
      }
    }, 'image/jpeg', 0.85)
  }, [])

  const handleStart = async () => {
    if (!camReady) return
    setRunning(true)
    setTranscript([])
    setPendingWord('')
    setSuggestions([])
    setCurrentLetter(null)
    setConfidence(0)
    setElapsed(0)
    lastLetterRef.current  = null
    repeatCountRef.current = 0
    wordCountRef.current   = 0
    sessionStartRef.current = Date.now()

    if (user) {
      try {
        const s = await createSession('Sign To Text')
        sessionIdRef.current = s.id
      } catch (e) { console.warn('Session create failed:', e.message) }
    }

    intervalRef.current = setInterval(captureAndPredict, CAPTURE_INTERVAL)
  }

  const handleStop = async () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setCurrentLetter(null)
    setSuggestions([])

    setPendingWord(current => {
      if (current.trim()) {
        setTranscript(t => [...t, current.trim()])
        wordCountRef.current += 1
      }
      return ''
    })

    if (sessionIdRef.current && sessionStartRef.current) {
      const mins = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000))
      try {
        await updateSession(sessionIdRef.current, {
          status:           'completed',
          duration_minutes: mins,
          word_count:       wordCountRef.current,
        })
      } catch (e) { console.warn('Session update failed:', e.message) }
      sessionIdRef.current    = null
      sessionStartRef.current = null
    }
  }

  // ── Confirm word ──────────────────────────────────────────────────────────
  const confirmWord = (word) => {
    const w = word.trim()
    if (!w) return
    setTranscript(t => [...t, w])
    wordCountRef.current += 1
    setPendingWord('')
    setSuggestions([])
    setSelectedSuggest(-1)
    lastLetterRef.current  = null
    repeatCountRef.current = 0
  }

  const handleSpace = () => {
    if (!pendingWord.trim()) return
    confirmWord(pendingWord)
  }

  // Accept a suggestion — replaces pendingWord with the full suggestion
  const acceptSuggestion = (word) => {
    confirmWord(word)
  }

  const handleBackspace = () => {
    setPendingWord(w => w.slice(0, -1))
  }

  const handleClear = () => {
    setTranscript([])
    setPendingWord('')
    setSuggestions([])
    wordCountRef.current   = 0
    lastLetterRef.current  = null
    repeatCountRef.current = 0
  }

  const fullText    = [...transcript, pendingWord].filter(Boolean).join(' ')
  const letterCount = fullText.replace(/\s/g, '').length
  const confPct     = (confidence * 100).toFixed(0)
  const confColor   = confidence >= 0.9 ? 'text-green-500' : confidence >= 0.75 ? 'text-amber-500' : 'text-red-400'
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar activePage="/session/sign-to-text" />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 pt-14 sm:pt-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)' }}
                className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">Sign to Text</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Real-time FSL alphabet → readable text</p>
            </div>
          </div>
          {running && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-600 font-mono tracking-wider">
                LIVE {mm}:{ss}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Camera panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Viewfinder */}
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              {camError ? (
                <div className="text-center px-6 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 00-2 2v4a2 2 0 002 2h9a2 2 0 002-2v-4a2 2 0 00-2-2H3z"/>
                    </svg>
                  </div>
                  <p className="text-red-400 text-sm font-medium mb-4">{camError}</p>
                  <button onClick={initCamera}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors">
                    Retry Camera
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} className="hidden" />

                  {running && currentLetter && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[72px]">
                      <p className="text-5xl font-black text-white leading-none tracking-tighter">{currentLetter}</p>
                      <p className={`text-xs font-bold mt-1 ${confColor}`}>{confPct}%</p>
                    </div>
                  )}

                  {predicting && (
                    <div className="absolute top-3 right-3 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}

                  {!running && camReady && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        </svg>
                      </div>
                      <p className="text-white/80 text-sm font-medium">Camera ready — press Start</p>
                    </div>
                  )}

                  {!camReady && !camError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 flex gap-3">
              {!running ? (
                <button onClick={handleStart} disabled={!camReady || !!camError}
                  className="flex-1 btn-shimmer text-white font-semibold py-3 rounded-xl text-sm
                    flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Start Signing
                </button>
              ) : (
                <button onClick={handleStop}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm
                    transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                  </svg>
                  Stop Session
                </button>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">How it works</p>
            <ol className="space-y-2">
              {[
                'Hold an FSL hand sign steady in front of the camera',
                `Hold still for ~${((CAPTURE_INTERVAL * REPEATS_TO_CONFIRM) / 1000).toFixed(1)}s — letter is confirmed`,
                'Tap a suggestion to complete the word instantly, or use Space to add manually',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-teal-700">
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center
                    flex-shrink-0 font-bold text-[10px] mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* RIGHT: Transcript panel */}
        <div className="flex flex-col gap-4">

          {/* Building word + suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Building word</p>
              {pendingWord && <span className="text-xs text-gray-400">{pendingWord.length} letters</span>}
            </div>

            {/* Letter tiles */}
            <div className="min-h-12 flex items-center mb-4">
              {pendingWord ? (
                <div className="flex flex-wrap gap-1.5">
                  {pendingWord.split('').map((ch, i) => (
                    <span key={i} className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200
                      flex items-center justify-center text-teal-700 font-bold text-lg">
                      {ch}
                    </span>
                  ))}
                  <span className="w-9 h-9 rounded-xl border-2 border-dashed border-teal-300
                    flex items-center justify-center text-teal-300 text-lg animate-pulse">
                    _
                  </span>
                </div>
              ) : (
                <p className="text-gray-300 text-sm italic">
                  {running ? 'Show a sign to the camera…' : 'Press Start to begin signing'}
                </p>
              )}
            </div>

            {/* ── Autocomplete suggestions ─────────────────────────────── */}
            <div className={`transition-all duration-200 overflow-hidden ${suggestions.length > 0 || suggestLoading ? 'mb-4' : 'mb-0 h-0'}`}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suggestions</span>
                {suggestLoading && (
                  <span className="w-3 h-3 border-2 border-teal-300 border-t-teal-500 rounded-full animate-spin ml-1" />
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                {suggestions.map((word, i) => (
                  <button
                    key={word}
                    onClick={() => acceptSuggestion(word)}
                    className={`group relative px-3.5 py-2 rounded-xl text-sm font-semibold
                      border transition-all duration-150 flex items-center gap-1.5
                      ${selectedSuggest === i
                        ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200'
                        : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-500 hover:border-teal-500 hover:text-white hover:shadow-md hover:shadow-teal-200'
                      }`}>
                    {/* Bold the matching prefix, normal for completion */}
                    <span>
                      <span className="font-black">{word.slice(0, pendingWord.length)}</span>
                      <span className="font-medium opacity-80">{word.slice(pendingWord.length)}</span>
                    </span>
                    {/* Tap indicator */}
                    <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                ))}

                {/* Empty state — typed 2+ letters but no matches */}
                {!suggestLoading && suggestions.length === 0 && pendingWord.length >= 2 && (
                  <span className="text-xs text-gray-300 italic py-2">No suggestions for "{pendingWord}"</span>
                )}
              </div>
            </div>

            {/* Word action buttons */}
            <div className="flex gap-2">
              <button onClick={handleSpace} disabled={!pendingWord}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl
                  hover:border-teal-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all
                  flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Space / Add word
              </button>
              <button onClick={handleBackspace} disabled={!pendingWord}
                className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl
                  hover:border-red-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Backspace">
                ⌫
              </button>
            </div>
          </div>

          {/* Full transcript */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transcript</p>
              {transcript.length > 0 && (
                <button onClick={handleClear}
                  className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[180px] max-h-[280px] overflow-y-auto">
              {fullText ? (
                <div className="flex flex-wrap gap-1.5">
                  {transcript.map((word, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-gray-800 rounded-lg
                      px-2.5 py-1 text-base font-semibold">
                      {word}
                    </span>
                  ))}
                  {pendingWord && (
                    <span className="inline-block bg-teal-50 border border-teal-200 text-teal-700
                      rounded-lg px-2.5 py-1 text-base font-semibold">
                      {pendingWord}<span className="animate-pulse ml-0.5 opacity-60">|</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <span className="text-5xl mb-3 block">🤟</span>
                  <p className="text-sm text-gray-300">Your transcript will appear here</p>
                </div>
              )}
            </div>

            {fullText && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(fullText)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold
                    text-gray-600 border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy text
                </button>
                <button onClick={handleClear}
                  className="px-4 py-2.5 text-sm font-semibold text-red-400 border border-red-100
                    rounded-xl hover:bg-red-50 transition-all">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Words',      value: transcript.length                                 },
              { label: 'Letters',    value: letterCount                                       },
              { label: 'Confidence', value: running && currentLetter ? `${confPct}%` : '—'   },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
                <p style={{ fontFamily: 'var(--font-display)' }}
                  className={`font-black text-xl ${s.label === 'Confidence' ? confColor : 'text-gray-900'}`}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
