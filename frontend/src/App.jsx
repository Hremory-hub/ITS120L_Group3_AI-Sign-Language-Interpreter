import { useState, useEffect } from 'react'
import Navbar   from './components/Navbar'
import Hero     from './components/Hero'
import Features from './components/Features'
import Pricing  from './components/Pricing'
import Footer   from './components/Footer'
import AboutOverview    from './pages/AboutOverview'
import AboutHowItWorks  from './pages/AboutHowItWorks'
import SignIn           from './pages/SignIn'
import SignUp           from './pages/SignUp'
import VerifyEmail from './pages/VerifyEmail'


function HomePage() {
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

// client-side router 
function useRoute() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)

    const onClick = (e) => {
      const a = e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href')
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        window.history.pushState(null, '', href)
        setPath(href)
        window.scrollTo(0, 0)
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', handler)
      document.removeEventListener('click', onClick)
    }
  }, [])
  return path
}

// Add this helper function (outside the App component)
export function navigate(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function App() {
  const path = useRoute()
  if (path === '/verify-email') return <VerifyEmail />
  if (path === '/about/overview')     return <AboutOverview />
  if (path === '/about/how-it-works') return <AboutHowItWorks />
  if (path === '/signin')             return <SignIn />
  if (path === '/signup')             return <SignUp />
  return <HomePage />
}
