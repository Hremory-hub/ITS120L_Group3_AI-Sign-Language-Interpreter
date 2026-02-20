export default function Footer() {
  return (
    <footer className="bg-teal-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-teal-400/50" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6
        flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-teal-100 text-sm text-center sm:text-left">
          © 2026 | All Rights Reserved | Powered by{' '}
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-white">KamAI</span>
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm text-teal-100">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>       
          <a href="#" className="hover:text-white transition-colors">Accessibility</a>
        </div>
      </div>
    </footer>
  )
}

// sa sunod nalang yung privacy policy, terms of service, etc. pages. for now they can just link to # lol