import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

const PLANS = [
  {
    id:    'free',
    name:  'Free',
    price: { monthly: 0, annual: 0 },
    desc:  'Great for trying out the core features of KamAI.',
    features: ['1 active session at a time', 'Sign Language Alphabet', '5 Class Profiles', 'Basic transcript export', 'Email support'],
    cta:       'Get Started Free',
    highlight: false,
  },
  {
    id:    'professional',
    name:  'Professional',
    price: { monthly: 100, annual: 900 },
    desc:  'Ideal for regular classroom and professional use.',
    features: ['Unlimited sessions', 'Speech to Sign Language', '15 Class Profiles', 'Full transcript history', 'Priority support'],
    cta:       'Get Professional',
    highlight: true,
    badge:     'Most Popular',
  },
  {
    id:    'enterprise',
    name:  'Enterprise',
    price: { monthly: 260, annual: 2340 },
    desc:  'Best for scaling classrooms and faculty environments.',
    features: ['Everything in Professional', 'Unlimited classrooms', 'Design System Foundation', 'Custom Vocabulary', 'Variants & Properties'],
    cta:       'Get Enterprise',
    highlight: false,
  },
]

export default function Pricing() {
  const [annual,  setAnnual]  = useState(false)
  const [modal,   setModal]   = useState(null)   // { tier, period } | null

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10 md:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-500">Pricing</span>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
            No hidden fees. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setAnnual(false)}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all
                ${!annual ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </button>
            <button onClick={() => setAnnual(true)}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5
                ${annual ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">–25%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {PLANS.map((plan) => (
            <div key={plan.id}
              className={`relative rounded-2xl p-6 sm:p-8 border transition-all duration-300
                ${plan.highlight
                  ? 'bg-teal-500 border-teal-500 text-white shadow-2xl shadow-teal-200 md:scale-105'
                  : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-lg'}`}>

              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400
                  text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                  {plan.badge}
                </span>
              )}

              <div className="mb-5 sm:mb-6">
                <h3 style={{ fontFamily: 'var(--font-display)' }}
                  className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm leading-snug ${plan.highlight ? 'text-teal-100' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
              </div>

              <div className="mb-6 sm:mb-8">
                <span style={{ fontFamily: 'var(--font-display)' }}
                  className={`font-black text-4xl sm:text-5xl ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  ₱{annual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-teal-100' : 'text-gray-400'}`}>
                  /{annual ? 'yr' : 'mo'}
                </span>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm
                    ${plan.highlight ? 'text-teal-50' : 'text-gray-600'}`}>
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0
                      ${plan.highlight ? 'text-teal-200' : 'text-teal-500'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setModal({ tier: plan.id, period: annual ? 'annual' : 'monthly' })}
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all
                  ${plan.highlight
                    ? 'bg-white text-teal-600 hover:bg-teal-50'
                    : 'btn-shimmer text-white'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Payments secured by <span className="font-semibold text-gray-500">PayMongo</span>
          {' '}· Accepts GCash, Maya, Credit &amp; Debit cards
        </p>
      </div>

      {/* Checkout modal */}
      {modal && (
        <CheckoutModal
          tier={modal.tier}
          period={modal.period}
          onClose={() => setModal(null)}
          onSuccess={() => setModal(null)}
        />
      )}
    </section>
  )
}
