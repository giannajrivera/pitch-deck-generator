'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Zap, Palette, FileText, Users, CheckCircle2 } from 'lucide-react'
import { useStore, useMode } from '@/lib/store'
import { ModeCards } from '@/components/ModeToggle'
import type { AppMode } from '@/lib/types'

const FEATURES = [
  { icon: <Zap size={20} />, title: 'One question at a time', desc: 'Guided flow maps directly to 12 investor-ready slides' },
  { icon: <Palette size={20} />, title: 'Branded output', desc: 'Upload your logo, colors & fonts — every slide reflects your brand' },
  { icon: <FileText size={20} />, title: 'Talk track included', desc: '3–5 minute speaker script generated alongside your deck' },
  { icon: <Users size={20} />, title: 'Workshop & Solo modes', desc: 'Faster flow for facilitated sessions, detailed guidance for self-study' },
]

const SLIDE_OVERVIEW = [
  'Intro', 'Problem', 'Solution', 'Product',
  'Market Size', 'Business Model', 'Traction', 'Competition',
  'Go-to-Market', 'Financials', 'Team', 'The Ask',
]

export default function LandingPage() {
  const router = useRouter()
  const mode = useMode()
  const { setMode, reset } = useStore()

  const handleStart = () => {
    router.push('/onboarding')
  }

  const handleContinue = () => {
    router.push('/questionnaire')
  }

  const { answers, generated } = useStore()
  const hasProgress = Object.keys(answers).length > 0
  const hasGenerated = !!generated

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">Connect.AI</span>
        </div>
        <div className="flex items-center gap-3">
          {hasProgress && (
            <button
              onClick={handleContinue}
              className="text-sm text-brand-200 hover:text-white transition-colors"
            >
              Continue building →
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-brand-200 mb-6">
          <Zap size={14} className="text-yellow-400" />
          Idea → Investor-ready pitch in 30 minutes
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
          Build your pitch deck
          <span className="block text-brand-300">with AI guidance</span>
        </h1>

        <p className="text-lg sm:text-xl text-brand-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          Answer 20 guided questions. Get a branded 12-slide deck, a 3–5 minute talk track,
          and coaching notes — ready to export as PDF or PPTX.
        </p>

        {/* Mode selector */}
        <div className="max-w-lg mx-auto mb-10">
          <p className="text-brand-300 text-sm font-medium mb-3">Choose your mode:</p>
          <ModeCards
            mode={mode}
            onChange={(m: AppMode) => setMode(m)}
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-brand-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            Start Building My Pitch
            <ArrowRight size={20} />
          </button>
          {hasProgress && (
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 bg-brand-700 border border-brand-500 text-white font-medium px-6 py-4 rounded-2xl text-base hover:bg-brand-600 transition-all"
            >
              Continue where I left off →
            </button>
          )}
        </div>

        {hasProgress && (
          <button
            onClick={() => { reset(); }}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Start fresh (clear saved progress)
          </button>
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">
            Everything you need to pitch with confidence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-5 rounded-2xl bg-brand-50 border border-brand-100">
                <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide overview */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-3">
            12 slides. Investor-standard structure.
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Every output follows the proven pitch deck framework used by top accelerators.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SLIDE_OVERVIEW.map((slide, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
              >
                <span className="text-xs font-bold text-brand-400 w-5">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700">{slide}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / use cases */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">
            Built for these moments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '🏫', title: 'SBDC Workshops', desc: 'Workshop mode helps facilitators run group pitch sessions with a consistent, fast-paced format.' },
              { emoji: '🎓', title: 'University Incubators', desc: 'Students build investor-ready decks with built-in coaching notes for faculty feedback.' },
              { emoji: '🚀', title: 'Early-Stage Founders', desc: 'Go from idea to a shareable pitch in under 30 minutes, any time of day.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-brand-900 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-white mb-10">
            What you&apos;ll get
          </h2>
          <div className="space-y-3">
            {[
              '12-slide pitch deck with content + design notes for each slide',
              '3–5 minute talk track script with your brand tone',
              'Comparison table for competition slide (built automatically)',
              'Financial projections table for financials slide',
              '4–6 specific improvement suggestions',
              'Coach notes for workshop facilitators',
              'Export to PDF and PPTX',
              'Branding applied throughout — colors, fonts, logo placement',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span className="text-brand-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-brand-50 transition-all shadow-xl"
            >
              Get started — it&apos;s free
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-800 py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center text-brand-300 text-xs">
          <span>Powered by Connect.AI</span>
        </div>
      </footer>
    </div>
  )
}
