const FEATURES = [ // dito lagay
  {
    icon: '🧠',
    title: 'Real-Time AI Detection',
    desc: 'Our neural network processes hand gestures at 30fps, translating sign language into text and speech in under 200ms.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: '🌍',
    title: 'Filipino Sign Language',
    desc: 'With integrated support to Filipino Sign Language, KamAI bridges communication across islands and cultures.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: '🎓',
    title: 'Built for Classrooms',
    desc: 'Purpose-built tools for teachers, students, and interpreters.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: '💻',
    title: 'Works Everywhere',
    desc: 'Browser-based with no installation required. Works on desktop PCs and laptops with a webcam.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    desc: 'All video processing happens on-device. No footage is ever stored or uploaded to our servers.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: '♿',
    title: 'Accessibility Built-In',
    desc: 'WCAG 2.1 AA compliant by default with high-contrast mode, screen reader support, and keyboard navigation.',
    color: 'bg-green-50 text-green-600',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-500">Features</span>
          <h2 style={{ fontFamily: 'var(--font-display)' }}
            className="font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Everything you need for
            <br />
            <span className="text-teal-500 italic">inclusive learning</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            KamAI removes the barriers between hearing and deaf communities — in real time, in any classroom.
          </p>
        </div>

        {/* Grid: 1 col mobile -> 2 cols tablet -> 3 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="group bg-white rounded-2xl p-6 sm:p-7 border border-gray-100
                hover:border-teal-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                text-xl sm:text-2xl ${f.color} mb-4 sm:mb-5
                group-hover:scale-110 transition-transform duration-200`}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)' }}
                className="font-bold text-base sm:text-lg text-gray-900 mb-2">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
