import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AboutOverview() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activePage="/about/overview" />

      {/* Teal accent bar under navbar */}
      <div className="h-2 bg-teal-500 mt-14 sm:mt-16" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        <h1 style={{ fontFamily: 'var(--font-display)' }}
          className="font-black text-4xl sm:text-5xl text-gray-900 mb-8">
          Overview
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-800 text-base sm:text-lg leading-relaxed font-semibold mb-6">
            KamAI is an AI-powered sign language interpreter built specifically for inclusive education.
            Our team believe every child deserves to communicate freely, regardless of hearing ability.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Our platform uses real-time computer vision and machine learning to detect and translate
            hand gestures into text, making classrooms more accessible for deaf
            and hard-of-hearing students across the Philippines and beyond.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Founded in 2026, KamAI was born out of a simple observation:
            the technology to bridge this communication gap already exists, only it just hadn't been
            packaged in a way that works for teachers and students. 
          </p>

          {/* Mission cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-10 not-prose">
            {[
              { icon: '🎯', title: 'Our Mission',  body: 'Break down communication barriers in education through accessible, affordable AI tools.' },
              { icon: '👁️', title: 'Our Vision',   body: 'A world where no student is left out of the conversation because of how they communicate.' },
              { icon: '💡', title: 'Our Approach', body: 'Human-centered design paired with machine learning. Built for educators.' },
            ].map(c => (
              <div key={c.title} className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
                <span className="text-2xl mb-3 block">{c.icon}</span>
                <h3 style={{ fontFamily: 'var(--font-display)' }}
                  className="font-bold text-base text-gray-900 mb-1">{c.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
