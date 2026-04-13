'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Copy, Check } from 'lucide-react'
import type { GeneratedOutput, BrandingProfile } from '@/lib/types'
import { SlideCard } from '@/components/SlideCard'
import { TalkTrackPanel } from '@/components/TalkTrackPanel'

type OutputTab = 'deck' | 'talktrack'

interface SessionData {
  generated: GeneratedOutput
  branding: BrandingProfile
  company_name: string | null
  mode: string
}

export default function SharedDeckPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<OutputTab>('deck')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Not found')
        setSession(data.session)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deck')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-brand-600 animate-spin" />
      </div>
    )
  }

  if (error || !session?.generated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">{error || 'Deck not found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }

  const { generated, branding, company_name } = session
  const companyName = company_name || 'Pitch Deck'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: branding?.colors?.[0] || '#002d62' }}
            >
              {companyName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800 text-sm truncate max-w-[160px]">
              {companyName}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 mx-auto">
            <button
              onClick={() => setActiveTab('deck')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'deck'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pitch Deck
            </button>
            <button
              onClick={() => setActiveTab('talktrack')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'talktrack'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Talk Track
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors ml-auto flex-shrink-0"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'deck' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {generated.slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                branding={branding}
                isExpanded={false}
                companyName={companyName}
              />
            ))}
          </div>
        )}

        {activeTab === 'talktrack' && (
          <TalkTrackPanel
            talkTrack={generated.talkTrack}
            quickImprovements={generated.quickImprovements}
            coachNotes={generated.coachNotes}
          />
        )}

        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
          <p>
            Created with{' '}
            <a href="/" className="text-brand-600 hover:text-brand-700 transition-colors">
              PitchDeck Generator
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
