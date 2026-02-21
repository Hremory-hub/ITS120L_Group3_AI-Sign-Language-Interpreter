import { useState, useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

// Nav links that should always go to homepage first
const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing',  href: '/#pricing'  },
  { label: 'Help',     href: '/help'      },
]

const ABOUT_ITEMS = [
  { label: 'Overview',     href: '/about/overview'    },
  { label: 'How It Works', href: '/about/how-it-works' },
]

// About Dropdown with Hover logic
function AboutDropdown({ activePage }) {
  const isAboutActive = activePage?.startsWith('/about');

  return (
    /* "group" on the parent allows us to trigger children on hover */
    <div className="relative group flex items-center h-full">
      <button
        type="button"
        className={`nav-underline flex items-center gap-1 text-sm font-medium transition-colors py-2
          ${isAboutActive ? 'text-teal-500 bg-gray-100 px-3 py-1 rounded-md' : 'text-gray-700 hover:text-teal-500'}`}
      >
        About App
        <svg 
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* THE BRIDGE: This invisible div fills the gap below the button 
         so the menu stays open as the mouse moves down.
      */}
      <div className="absolute top-full left-0 w-full h-4 opacity-0" aria-hidden="true"></div>

      {/* Dropdown Menu - Controlled by group-hover */}
      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 
        invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
        {ABOUT_ITEMS.map(item => (
          <a 
            key={item.href} 
            href={item.href}
            className={`block px-4 py-2.5 text-sm transition-colors
              ${activePage === item.href
                ? 'bg-teal-50 text-teal-600 font-semibold'
                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/'
  }

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  const displayName = user.displayName || user.email

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-400" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-300">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {displayName}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <a href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </a>
          <a href="/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profile
          </a>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar({ activePage }) {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user,       setUser]       = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/'
  }

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const sectionId = href.slice(2) 
      if (window.location.pathname === '/') {
        // Already on homepage - just smooth scroll
        e.preventDefault()
        const el = document.getElementById(sectionId)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      } else {

      }
      setMobileOpen(false)
      return
    }

    // Internal SPA links — handled by App.jsx's click interceptor
    setMobileOpen(false)
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/assets/logo.png"
            alt="KamAI logo"
            className="h-9 w-auto"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-xl text-gray-900">
            Kam<span className="text-teal-500">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          <li><AboutDropdown activePage={activePage} /></li>
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="nav-underline text-sm font-medium text-gray-700 hover:text-teal-500 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <a href="/signin" className="text-sm font-medium text-gray-700 hover:text-teal-500 transition-colors">
                Sign In
              </a>
              <a href="/signup" className="btn-shimmer text-white text-sm font-semibold px-5 py-2 rounded-lg">
                Sign Up
              </a>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200 mb-1.5 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200 mb-1.5 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-40 px-4 py-6 flex flex-col gap-1 animate-fadeIn overflow-y-auto">

          {user && (
            <div className="flex items-center gap-3 px-3 py-4 mb-2 bg-teal-50 rounded-xl">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full ring-2 ring-teal-400" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.displayName || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* About sub-links */}
          <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-widest text-gray-400">About App</p>
          {ABOUT_ITEMS.map(item => (
            <a key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 px-6 text-sm font-medium text-gray-600 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors">
              {item.label}
            </a>
          ))}

          <div className="h-px bg-gray-100 my-2" />

          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block py-3 px-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors"
            >
              {link.label}
            </a>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="mt-6 w-full text-center py-3 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              Sign Out
            </button>
          ) : (
            <div className="flex gap-3 mt-6">
              <a href="/signin" className="flex-1 text-center py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-colors">
                Sign In
              </a>
              <a href="/signup" className="flex-1 text-center py-3 text-sm font-semibold text-white rounded-xl btn-shimmer">
                Sign Up
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
