import { useState, useEffect, useRef } from 'react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing',  href: '#pricing'  },
  { label: 'Help',     href: '#help'     },
]

const ABOUT_ITEMS = [
  { label: 'Our Mission',  href: '#mission' },
  { label: 'How It Works', href: '#how'     },
  { label: 'Our Team',     href: '#team'    },
]

function AboutDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="nav-underline flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-teal-500 transition-colors"
      >
        About App
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
          {ABOUT_ITEMS.map(item => (
            <a key={item.href} href={item.href}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <span className="animate-wave origin-bottom inline-block">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#2AABAC" fillOpacity="0.12"/>
              <text x="18" y="24" textAnchor="middle" fontSize="17" fill="#2AABAC">🤟</text>
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-xl text-gray-900">
            Kam<span className="text-teal-500">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          <li><AboutDropdown /></li>
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a href={link.href}
                className="nav-underline text-sm font-medium text-gray-700 hover:text-teal-500 transition-colors">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-gray-700 hover:text-teal-500 transition-colors">
            Sign-In
          </a>
          <a href="#" className="btn-shimmer text-white text-sm font-semibold px-5 py-2 rounded-lg">
            Sign up
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200 mb-1.5
            ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200 mb-1.5
            ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-800 transition-all duration-200
            ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-40 px-4 py-6 flex flex-col gap-1 animate-fadeIn overflow-y-auto">
          <a href="#" className="block py-3 px-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-600 border-b border-gray-100 transition-colors"
            onClick={() => setMobileOpen(false)}>About App</a>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 px-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-600 border-b border-gray-100 transition-colors">
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 mt-6">
            <a href="#" className="flex-1 text-center py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-colors">
              Sign-In
            </a>
            <a href="#" className="flex-1 text-center py-3 text-sm font-semibold text-white rounded-xl btn-shimmer">
              Sign up
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
