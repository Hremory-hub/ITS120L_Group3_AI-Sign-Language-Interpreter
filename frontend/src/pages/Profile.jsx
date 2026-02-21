import { useState, useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, updateProfile, updateEmail } from 'firebase/auth'
// Storage imports — will be used once you add Firebase Storage to your firebase.js
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ─── Reusable read/edit field ───────────────────────────────────────────────
function Field({ label, value, editing, onChange, type = 'text', options, fullWidth, placeholder }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select value={value} onChange={onChange}
            className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all">
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Profile() {
  const [user,          setUser]          = useState(null)
  const [loading,       setLoading]       = useState(true)

  // Editable draft fields — these extend what Firebase Auth stores
  // Firebase Auth only has: displayName, email, photoURL
  // Extra fields (role, school, phone, bio) → store in Firestore later
  const [editing,       setEditing]       = useState(false)
  const [draft,         setDraft]         = useState({
    displayName: '', email: '', role: '', school: '', phone: '', bio: ''
  })

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState('')

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setDraft({
          displayName: currentUser.displayName  ?? '',
          email:       currentUser.email        ?? '',
          // Extra fields not in Firebase Auth — will come from Firestore later
          role:    '',
          school:  '',
          phone:   '',
          bio:     '',
        })
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  // ── Photo selection ──
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB.')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  // ── Save handler ──
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      let photoURL = user.photoURL

      // ── Upload photo to Firebase Storage ──────────────────────────────────
      // UNCOMMENT this block once you add Storage to your firebase.js:
      //
      // if (avatarFile) {
      //   const storage = getStorage()
      //   const storageRef = ref(storage, `avatars/${user.uid}`)
      //   await uploadBytes(storageRef, avatarFile)
      //   photoURL = await getDownloadURL(storageRef)
      // }
      // ─────────────────────────────────────────────────────────────────────

      // Update Firebase Auth profile (displayName + photoURL)
      await updateProfile(user, {
        displayName: draft.displayName.trim() || user.displayName,
        photoURL,
      })

      // Update email if changed
      if (draft.email && draft.email !== user.email) {
        await updateEmail(user, draft.email.trim())
      }

      // TODO: save extra fields (role, school, phone, bio) to Firestore:
      // await setDoc(doc(db, 'users', user.uid), {
      //   role: draft.role, school: draft.school,
      //   phone: draft.phone, bio: draft.bio,
      // }, { merge: true })

      // Refresh local user object from auth
      setUser({ ...auth.currentUser })
      setEditing(false)
      setSaved(true)
      setAvatarFile(null)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before changing your email.')
      } else {
        setError(err.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft({
      displayName: user?.displayName ?? '',
      email:       user?.email ?? '',
      role: '', school: '', phone: '', bio: '',
    })
    setAvatarPreview(null)
    setAvatarFile(null)
    setError('')
    setEditing(false)
  }

  const set = (k) => (e) => setDraft(d => ({ ...d, [k]: e.target.value }))

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading profile…</p>
        </div>
      </div>
    )
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar activePage="/profile" />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 px-4 text-center">
          <span className="text-5xl">🔒</span>
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-2xl text-gray-900">
            Sign in to view your profile
          </h2>
          <p className="text-gray-500 text-sm">You need to be logged in to access this page.</p>
          <a href="/signin" className="btn-shimmer text-white font-semibold px-6 py-3 rounded-xl text-sm">
            Sign In
          </a>
        </div>
        <Footer />
      </div>
    )
  }

  const photoSrc = avatarPreview || user.photoURL

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar activePage="/profile" />

      {/* Teal banner */}
      <div className="bg-teal-500 mt-14 sm:mt-16 h-36 sm:h-44 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-teal-400 opacity-30" />
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pb-16">

        {/* Avatar + actions row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20 mb-6 sm:mb-8">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-teal-500 flex items-center justify-center">
              {photoSrc ? (
                <img src={photoSrc} alt={user.displayName ?? 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {initials}
                </span>
              )}
            </div>

            {/* Camera button — only while editing */}
            {editing && (
              <label className="absolute bottom-1 right-1 w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded-full
                flex items-center justify-center cursor-pointer shadow-md transition-colors z-10"
                title="Change photo">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Name + role display (view mode) */}
          {!editing && (
            <div className="flex-1 pb-1">
              <h1 style={{ fontFamily: 'var(--font-display)' }}
                className="font-black text-2xl sm:text-3xl text-gray-900">
                {user.displayName || 'Your Name'}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            </div>
          )}

          {/* Save / Edit buttons */}
          <div className="flex items-center gap-2 pb-1 sm:ml-auto flex-wrap">
            {/* Storage note — shown when a file is picked but storage not yet wired */}
            {avatarFile && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                ⚠ Enable Firebase Storage to persist photos
              </span>
            )}

            {saved && !editing && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </span>
            )}

            {editing ? (
              <>
                <button onClick={handleCancel} disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white btn-shimmer rounded-xl flex items-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">

          {/* Personal Info */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Personal Information</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                Synced with Firebase Auth
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" editing={editing}
                value={editing ? draft.displayName : (user.displayName ?? '')}
                onChange={set('displayName')} placeholder="Your full name" />

              <Field label="Email Address" editing={editing}
                value={editing ? draft.email : (user.email ?? '')}
                onChange={set('email')} type="email" />

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Account UID</label>
                <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-2 rounded-lg truncate">
                  {user.uid}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Verified</label>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                    ⚠ Not verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Extra fields (DB-backed later) */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">School / Role</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                Firestore (coming soon)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Role" editing={editing}
                value={editing ? draft.role : (draft.role || '')}
                onChange={set('role')} type="select"
                options={['Faculty', 'Administrator', 'Student', 'Parent', 'Other']} />
              <Field label="Phone Number" editing={editing}
                value={editing ? draft.phone : (draft.phone || '')}
                onChange={set('phone')} type="tel" placeholder="+63 9XX XXX XXXX" />
              <Field label="School / Institution" editing={editing}
                value={editing ? draft.school : (draft.school || '')}
                onChange={set('school')} fullWidth placeholder="Your school name" />
            </div>
          </div>

          {/* Bio */}
          <div className="px-6 sm:px-8 py-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-5">About Me</h2>
            {editing ? (
              <textarea rows={3} value={draft.bio} onChange={set('bio')}
                placeholder="Tell us a bit about yourself…"
                className="w-full px-4 py-3 text-sm bg-gray-100 border border-transparent rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white
                  placeholder:text-gray-400 transition-all resize-none" />
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">
                {draft.bio || <span className="text-gray-400 italic">No bio added yet. Click Edit Profile to add one.</span>}
              </p>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 border border-red-100 rounded-2xl px-6 py-5">
          <h3 className="text-sm font-bold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-xs text-gray-400 mb-4">These actions are permanent and cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <button className="text-xs font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Change Password
            </button>
            <button className="text-xs font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
