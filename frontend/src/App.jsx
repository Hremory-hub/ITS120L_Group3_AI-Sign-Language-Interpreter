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

    // Intercept link clicks
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

export default function App() {
  const path = useRoute()

  if (path === '/about/overview')    return <AboutOverview />
  if (path === '/about/how-it-works') return <AboutHowItWorks />
  if (path === '/signin')             return <SignIn />
  if (path === '/signup')             return <SignUp />
  return <HomePage />
}
