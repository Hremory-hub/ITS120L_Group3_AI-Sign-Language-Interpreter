import { useState, useEffect } from 'react'
import Navbar             from './components/Navbar'
import Hero               from './components/Hero'
import Features           from './components/Features'
import Pricing            from './components/Pricing'
import Footer             from './components/Footer'
import AboutOverview      from './pages/AboutOverview'
import AboutHowItWorks    from './pages/AboutHowItWorks'
import SignIn             from './pages/SignIn'
import SignUp             from './pages/SignUp'
import Help               from './pages/Help'
import Profile            from './pages/Profile'
import Dashboard          from './pages/Dashboard'
import SignToText         from './pages/SignToText'
import VerifyEmail       from './pages/VerifyEmail'
import Checkout          from './pages/Checkout'
import PaymentSuccess    from './pages/PaymentSuccess'
import PaymentCancelled  from './pages/PaymentCancelled'

function HomePage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const t = setTimeout(() => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="font-body">
      <Navbar activePage="/" />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)

    const onClick = (e) => {
      const a = e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href) return

      if (href.startsWith('/#')) {
        if (window.location.pathname !== '/') {
          e.preventDefault()
          window.history.pushState(null, '', href)
          setPath('/')
        }
        return
      }

      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        window.history.pushState(null, '', href)
        setPath(href)
        window.scrollTo(0, 0)
      }
    }

    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return path
}

export default function App() {
  const path = useRoute()

  if (path === '/about/overview')     return <AboutOverview />
  if (path === '/about/how-it-works') return <AboutHowItWorks />
  if (path === '/signin')             return <SignIn />
  if (path === '/signup')             return <SignUp />
  if (path === '/help')               return <Help />
  if (path === '/profile')            return <Profile />
  if (path === '/dashboard')          return <Dashboard />
  if (path === '/session/sign-to-text') return <SignToText />
  if (path === '/verify-email')         return <VerifyEmail />
  if (path === '/checkout')             return <Checkout />
  if (path === '/payment/success')      return <PaymentSuccess />
  if (path === '/payment/cancelled')    return <PaymentCancelled />
  return <HomePage />
}
