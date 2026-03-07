/**
 * /payment/cancelled
 * User closed PayMongo checkout or payment was declined.
 * Params: ?tier=X
 *
 * Strategy: show a friendly page explaining nothing was charged,
 * offer to retry or go back to pricing.
 */
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PaymentCancelled() {
  const p    = new URLSearchParams(window.location.search)
  const tier = p.get('tier') || 'professional'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">

            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-300
              flex items-center justify-center mx-auto mb-6">
              <svg className="w-9 h-9 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)' }}
              className="font-black text-2xl text-gray-900 mb-2">Payment cancelled</h2>
            <p className="text-gray-500 text-sm mb-8">
              No worries — you were <span className="font-semibold">not charged</span>.
              You can complete the payment whenever you're ready.
            </p>

            <div className="flex gap-3">
              <a href={`/checkout?tier=${tier}&period=monthly`}
                className="flex-1 btn-shimmer text-white font-semibold py-3 rounded-xl text-sm text-center">
                Try again
              </a>
              <a href="/#pricing"
                className="flex-1 text-center py-3 text-sm font-semibold text-gray-600
                  border border-gray-200 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-all">
                View plans
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
