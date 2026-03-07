import { useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, updateProfile as fbUpdateProfile, updateEmail, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { getProfile, updateProfile as apiUpdateProfile, uploadAvatar, getMySubscription } from '../api'
import { PHOTO_UPDATED_EVENT } from '../components/Navbar'
import CheckoutModal from '../components/CheckoutModal'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ── Reusable field ─────────────────────────────────────────────────────── */
function Field({ label, value, editing, onChange, type = 'text', options, fullWidth, placeholder }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select value={value ?? ''} onChange={onChange}
            className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all">
            <option value="">— Select —</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder}
            className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all" />
        )
      ) : (
        <p className="text-sm text-gray-800 font-medium py-1">
          {value || <span className="text-gray-400 italic">Not set</span>}
        </p>
      )}
    </div>
  )
}

/* ── Skeleton row ───────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {[1,2,3].map(i => <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Profile() {
  const [authUser,    setAuthUser]    = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingDB,   setLoadingDB]   = useState(false)
  const [dbProfile,   setDbProfile]   = useState(null)

  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState({ display_name:'', email:'', role:'', school:'', phone:'', bio:'' })
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  const [sub,          setSub]          = useState(null)
  const [checkoutModal, setCheckoutModal] = useState(null)  // { tier, period } | null
  const [showPasswordModal,  setShowPasswordModal]  = useState(false)
  const [showDeleteModal,    setShowDeleteModal]    = useState(false)
  const [showManagePlanModal,setShowManagePlanModal] = useState(false)
  // Password reset state
  const [pwSent,    setPwSent]    = useState(false)
  const [pwError,   setPwError]   = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  // Delete account state
  const [delConfirm, setDelConfirm] = useState('')
  const [delError,   setDelError]   = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const [avatarFile,    setAvatarFile]    = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  /* 1 — Firebase auth state */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setAuthUser(u); setLoadingAuth(false) })
    return () => unsub()
  }, [])

  /* 2 — Fetch MySQL profile once auth is ready */
  useEffect(() => {
    if (!authUser) return
    setLoadingDB(true)
    getProfile()
      .then(data => {
        setDbProfile(data)
        setDraft({
          display_name: data.display_name ?? authUser.displayName ?? '',
          email:        data.email        ?? authUser.email        ?? '',
          role:         data.role         ?? '',
          school:       data.school       ?? '',
          phone:        data.phone        ?? '',
          bio:          data.bio          ?? '',
        })
      })
      .catch(err => {
        console.warn('Profile API unavailable, falling back to Firebase Auth:', err.message)
        setDraft({
          display_name: authUser.displayName ?? '',
          email:        authUser.email       ?? '',
          role:'', school:'', phone:'', bio:'',
        })
      })
      .finally(() => setLoadingDB(false))

    // Also load subscription tier
    getMySubscription().then(setSub).catch(() => {})
  }, [authUser])

  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }))

  const initials  = (draft.display_name || authUser?.email || '?')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const photoSrc  = avatarPreview || dbProfile?.photo_url || authUser?.photoURL

  /* ── Photo pick ── */
  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  /* ── Save ── */
  const handleSave = async () => {
    if (!authUser) return
    setSaving(true); setError('')
    try {
      // 1. Upload avatar → backend stores file, returns URL → saved to MySQL
      if (avatarFile) await uploadAvatar(avatarFile)

      // 2. Sync displayName back to Firebase Auth (keeps Navbar in sync)
      if (draft.display_name !== authUser.displayName)
        await fbUpdateProfile(authUser, { displayName: draft.display_name })

      // 3. Update email in Firebase Auth if changed
      if (draft.email && draft.email !== authUser.email)
        await updateEmail(authUser, draft.email.trim())

      // 4. PATCH /users/me — saves all fields to MySQL users table
      const updated = await apiUpdateProfile({
        display_name: draft.display_name || null,
        email:        draft.email        || null,
        role:         draft.role         || null,
        school:       draft.school       || null,
        phone:        draft.phone        || null,
        bio:          draft.bio          || null,
      })

      setDbProfile(updated)
      setAvatarFile(null); setAvatarPreview(null)
      setEditing(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      // Tell Navbar to update its avatar immediately without a page reload
      const newPhoto = updated.photo_url || auth.currentUser?.photoURL || null
      window.dispatchEvent(new CustomEvent(PHOTO_UPDATED_EVENT, { detail: newPhoto }))
    } catch (err) {
      setError(
        err.code === 'auth/requires-recent-login'
          ? 'Please sign out and back in to change your email.'
          : err.message ?? 'Something went wrong.'
      )
    } finally { setSaving(false) }
  }


  /* ── Change Password ── */
  const handleSendPasswordReset = async () => {
    setPwError(''); setPwLoading(true)
    try {
      await sendPasswordResetEmail(auth, authUser.email)
      setPwSent(true)
    } catch (err) {
      setPwError(err.message || 'Failed to send reset email.')
    } finally { setPwLoading(false) }
  }

  /* ── Delete Account ── */
  const handleDeleteAccount = async () => {
    if (delConfirm !== 'DELETE') {
      setDelError('Please type DELETE to confirm.')
      return
    }
    setDelError(''); setDelLoading(true)
    try {
      // Delete from Firebase Auth (this also invalidates the token)
      await deleteUser(authUser)
      window.location.href = '/'
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setDelError('For security, please sign out and sign back in before deleting your account.')
      } else {
        setDelError(err.message || 'Failed to delete account.')
      }
    } finally { setDelLoading(false) }
  }

  const handleCancel = () => {
    setDraft({
      display_name: dbProfile?.display_name ?? authUser?.displayName ?? '',
      email:        dbProfile?.email        ?? authUser?.email        ?? '',
      role:   dbProfile?.role   ?? '',
      school: dbProfile?.school ?? '',
      phone:  dbProfile?.phone  ?? '',
      bio:    dbProfile?.bio    ?? '',
    })
    setAvatarFile(null); setAvatarPreview(null); setError(''); setEditing(false)
  }

  /* ── Guards ── */
  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
    </div>
  )

  if (!authUser) return (
    <div className="min-h-screen flex flex-col">
      <Navbar activePage="/profile" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">🔒</span>
        <h2 style={{ fontFamily:'var(--font-display)' }} className="font-bold text-2xl text-gray-900">
          Sign in to view your profile
        </h2>
        <a href="/signin" className="btn-shimmer text-white font-semibold px-6 py-3 rounded-xl text-sm">Sign In</a>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar activePage="/profile" />

      {/* Banner */}
      <div className="bg-teal-500 mt-14 sm:mt-16 h-36 sm:h-44 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-teal-400 opacity-30" />
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pb-16">

        {/* Avatar + action row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20 mb-6 sm:mb-8">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white shadow-lg overflow-hidden
              bg-teal-500 flex items-center justify-center">
              {photoSrc
                ? <img src={photoSrc} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-3xl sm:text-4xl"
                    style={{ fontFamily:'var(--font-display)' }}>{initials}</span>
              }
              {loadingDB && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-1 right-1 w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded-full
                flex items-center justify-center cursor-pointer shadow-md transition-colors z-10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Name (view mode) */}
          {!editing && (
            <div className="flex-1 pb-1">
              <h1 style={{ fontFamily:'var(--font-display)' }}
                className="font-black text-2xl sm:text-3xl text-gray-900">
                {draft.display_name || authUser.displayName || 'Your Name'}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {draft.role && <span className="text-teal-600 font-medium">{draft.role} · </span>}
                {authUser.email}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 pb-1 sm:ml-auto flex-wrap">
            {saved && !editing && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>Saved!
              </span>
            )}
            {editing ? (
              <>
                <button onClick={handleCancel} disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl
                    hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white btn-shimmer rounded-xl
                    flex items-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700
                  border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>{error}
          </div>
        )}


        {/* ── Subscription / Tier card ── */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Subscription</h2>
            {sub && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                ${sub.tier === 'enterprise'   ? 'bg-violet-100 text-violet-700' :
                  sub.tier === 'professional' ? 'bg-teal-100 text-teal-700' :
                                                'bg-gray-100 text-gray-500'}`}>
                {sub.tier ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) : 'Free'}
              </span>
            )}
          </div>

          <div className="px-6 sm:px-8 py-5">
            {!sub ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-teal-300 border-t-teal-500 animate-spin flex-shrink-0" />
                <span className="text-sm text-gray-400">Loading plan…</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {/* Tier icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${sub.tier === 'enterprise'   ? 'bg-violet-100' :
                      sub.tier === 'professional' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                    {sub.tier === 'enterprise' ? (
                      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    ) : sub.tier === 'professional' ? (
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {sub.tier ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) : 'Free'} Plan
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sub.billing_period
                        ? sub.billing_period.charAt(0).toUpperCase() + sub.billing_period.slice(1) + ' billing'
                        : 'No billing'}
                      {sub.expires_at && (
                        <> · Renews {new Date(sub.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowManagePlanModal(true)}
                  className="text-xs font-semibold text-teal-600 border border-teal-200 px-4 py-2
                    rounded-xl hover:bg-teal-50 transition-colors flex-shrink-0">
                  {sub.tier === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">

          {/* ── Firebase Auth fields ── */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Personal Information</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Firebase Auth</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name"     editing={editing}
                value={editing ? draft.display_name : (draft.display_name || authUser.displayName)}
                onChange={set('display_name')} placeholder="Your full name" />
              <Field label="Email Address" editing={editing}
                value={editing ? draft.email : (draft.email || authUser.email)}
                onChange={set('email')} type="email" />
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Account UID</label>
                <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-2 rounded-lg truncate">{authUser.uid}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Verified</label>
                {authUser.emailVerified
                  ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>Verified
                    </span>
                  : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                      ⚠ Not verified
                    </span>
                }
              </div>
            </div>
          </div>

          {/* ── MySQL fields ── */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">School / Role</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">MySQL · users</span>
            </div>
            {loadingDB ? <Skeleton /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Role" editing={editing} value={editing ? draft.role : draft.role}
                  onChange={set('role')} type="select"
                  options={['Faculty','Administrator','Student','Parent','Other']} />
                <Field label="Phone" editing={editing} value={editing ? draft.phone : draft.phone}
                  onChange={set('phone')} type="tel" placeholder="+63 9XX XXX XXXX" />
                <Field label="School / Institution" editing={editing}
                  value={editing ? draft.school : draft.school}
                  onChange={set('school')} fullWidth placeholder="Your school name" />
              </div>
            )}
          </div>

          {/* ── Bio ── */}
          <div className="px-6 sm:px-8 py-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-5">About Me</h2>
            {loadingDB
              ? <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              : editing
                ? <textarea rows={3} value={draft.bio ?? ''} onChange={set('bio')}
                    placeholder="Tell us about yourself…"
                    className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                      placeholder:text-gray-400 transition-all resize-none" />
                : <p className="text-sm text-gray-600 leading-relaxed">
                    {draft.bio || <span className="text-gray-400 italic">No bio yet — click Edit Profile to add one.</span>}
                  </p>
            }
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 border border-red-100 rounded-2xl px-6 py-5">
          <h3 className="text-sm font-bold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-xs text-gray-400 mb-4">These actions are permanent and cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setShowPasswordModal(true); setPwSent(false); setPwError('') }}
              className="text-xs font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Change Password
            </button>
            <button onClick={() => { setShowDeleteModal(true); setDelConfirm(''); setDelError('') }}
              className="text-xs font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </main>
      <Footer />


      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowPasswordModal(false) }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <button onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200
                flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-xl text-gray-900 mb-1">Change Password</h3>
            <p className="text-sm text-gray-500 mb-6">
              We'll send a password reset link to <span className="font-semibold text-gray-700">{authUser?.email}</span>.
            </p>
            {pwSent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 text-center">
                <p className="text-sm font-semibold text-green-700 mb-1">Reset email sent! ✅</p>
                <p className="text-xs text-green-600">Check your inbox and follow the link to set a new password.</p>
              </div>
            ) : (
              <>
                {pwError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{pwError}</div>
                )}
                <button onClick={handleSendPasswordReset} disabled={pwLoading}
                  className="w-full btn-shimmer text-white font-semibold py-3.5 rounded-xl text-sm
                    flex items-center justify-center gap-2 disabled:opacity-60">
                  {pwLoading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Sending…</>
                    : 'Send Reset Email'
                  }
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <button onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200
                flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-xl text-gray-900 mb-1">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete your account and all your data. This cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-red-600 font-medium">Type <span className="font-mono font-bold">DELETE</span> to confirm</p>
            </div>
            <input
              type="text"
              value={delConfirm}
              onChange={e => setDelConfirm(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white
                placeholder:text-gray-400 transition-all mb-4 font-mono"
            />
            {delError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{delError}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={delLoading || delConfirm !== 'DELETE'}
                className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600
                  rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {delLoading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Deleting…</>
                  : 'Delete My Account'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Plan Modal ── */}
      {showManagePlanModal && sub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowManagePlanModal(false) }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-teal-500 px-8 pt-8 pb-6">
              <button onClick={() => setShowManagePlanModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30
                  flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-100 mb-1">Current Plan</p>
              <h3 style={{ fontFamily: 'var(--font-display)' }} className="font-black text-2xl text-white">
                {sub.tier ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) : 'Free'}
              </h3>
              <p className="text-teal-100 text-sm mt-1">
                {sub.billing_period ? sub.billing_period.charAt(0).toUpperCase() + sub.billing_period.slice(1) + ' billing' : 'No billing'}
                {sub.expires_at && ` · Renews ${new Date(sub.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </p>
            </div>

            <div className="px-8 py-6 space-y-3">
              {/* Change plan options */}
              {sub.tier !== 'professional' && (
                <button
                  onClick={() => { setShowManagePlanModal(false); setCheckoutModal({ tier: 'professional', period: sub.billing_period || 'monthly' }) }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-teal-200
                    hover:border-teal-400 hover:bg-teal-50 transition-all group">
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">Switch to Professional</p>
                    <p className="text-xs text-gray-400">₱100/mo · Unlimited sessions</p>
                  </div>
                  <svg className="w-4 h-4 text-teal-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
              {sub.tier !== 'enterprise' && (
                <button
                  onClick={() => { setShowManagePlanModal(false); setCheckoutModal({ tier: 'enterprise', period: sub.billing_period || 'monthly' }) }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-violet-200
                    hover:border-violet-400 hover:bg-violet-50 transition-all group">
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">Switch to Enterprise</p>
                    <p className="text-xs text-gray-400">₱260/mo · Everything included</p>
                  </div>
                  <svg className="w-4 h-4 text-violet-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
              {sub.tier !== 'free' && (
                <button
                  onClick={async () => {
                    // Downgrade to free — call backend to upsert free subscription
                    try {
                      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payments/checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
                        body: JSON.stringify({ tier: 'free', billing_period: 'monthly' })
                      })
                      const updated = await (await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payments/my-subscription`, {
                        headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` }
                      })).json()
                      setSub(updated)
                      setShowManagePlanModal(false)
                    } catch { /* ignore */ }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-200
                    hover:border-red-300 hover:bg-red-50 transition-all group">
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-700">Unsubscribe / Downgrade to Free</p>
                    <p className="text-xs text-gray-400">You'll lose access to premium features</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
