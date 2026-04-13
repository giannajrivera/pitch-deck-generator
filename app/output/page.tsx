'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Edit2, Zap, ChevronDown, ChevronUp, Layout, Save, Share2, Check, Loader2, User, ExternalLink } from 'lucide-react'
import { useStore, useGenerated, useBranding, useAnswers, useMode, useUserId, useSessionId } from '@/lib/store'
import type { PitchDeckSlide } from '@/lib/types'
import { SlideCard } from '@/components/SlideCard'
import { TalkTrackPanel } from '@/components/TalkTrackPanel'
import { ExportButtons } from '@/components/ExportButtons'
import { ModeToggle } from '@/components/ModeToggle'

type OutputTab = 'deck' | 'talktrack'

export default function OutputPage() {
  return (
    <Suspense>
      <OutputPageInner />
    </Suspense>
  )
}

function OutputPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const generated = useGenerated()
  const branding = useBranding()
  const answers = useAnswers()
  const mode = useMode()
  const userId = useUserId()
  const sessionId = useSessionId()
  const { setMode, setGenerated, setSessionId } = useStore()

  const [activeTab, setActiveTab] = useState<OutputTab>('deck')
  const [allExpanded, setAllExpanded] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(sessionId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/decks/${sessionId}` : null)
  const [copied, setCopied] = useState(false)

  // Canva state
  const [canvaLoading, setCanvaLoading] = useState(false)
  const [canvaError, setCanvaError] = useState<string | null>(null)
  const [canvaPromptCopied, setCanvaPromptCopied] = useState<null | 1 | 2>(null)
  const canvaTriggered = useRef(false)

  const companyName = answers.company_name || 'Your Company'

  // Redirect if no generated output
  useEffect(() => {
    if (!generated) {
      router.push('/questionnaire')
    }
  }, [generated, router])

  // Handle return from Canva OAuth — auto-trigger import
  useEffect(() => {
    if (!generated) return
    const canvaReady = searchParams.get('canva_ready')
    const canvaErr = searchParams.get('error')

    if (canvaErr) {
      setCanvaError('Canva connection failed. Please try again.')
      return
    }

    if (canvaReady === '1' && !canvaTriggered.current) {
      canvaTriggered.current = true
      importToCanva()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, generated])

  if (!generated) return null

  const importToCanva = async () => {
    setCanvaLoading(true)
    setCanvaError(null)

    try {
      // Start the import job
      const createRes = await fetch('/api/canva/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output: generated, branding, companyName }),
      })

      if (createRes.status === 401) {
        // Token expired — re-authenticate
        window.location.href = '/api/canva/auth'
        return
      }

      if (!createRes.ok) throw new Error('Failed to start Canva import')

      const { jobId } = await createRes.json()

      // Poll for completion
      let attempts = 0
      while (attempts < 20) {
        await new Promise(r => setTimeout(r, 1500))
        const statusRes = await fetch(`/api/canva/status?jobId=${jobId}`)
        const { status, url } = await statusRes.json()

        if (status === 'success' && url) {
          window.open(url, '_blank')
          setCanvaLoading(false)
          return
        }
        if (status === 'failed') throw new Error('Canva import failed')
        attempts++
      }

      throw new Error('Canva import timed out — please try again')
    } catch (err) {
      setCanvaError(err instanceof Error ? err.message : 'Something went wrong')
      setCanvaLoading(false)
    }
  }

  const handleOpenInCanva = () => {
    setCanvaError(null)
    window.location.href = '/api/canva/auth'
  }

  const SLIDE_LABELS: Record<string, string> = {
    intro: 'Intro', problem: 'Problem', solution: 'Solution',
    product: 'Product', market: 'Market Size', businessModel: 'Business Model',
    traction: 'Traction', competition: 'Competition', gtm: 'Go to Market Strategy',
    financials: 'Financials', team: 'Team', ask: 'Ask',
  }

  const buildCompactSlideBlock = (slide: PitchDeckSlide, i: number): string => {
    const label = SLIDE_LABELS[slide.id] || slide.title
    // Strict truncation on every field
    const msg = (slide.coreMessage || '').slice(0, 75)
    const bullets = (slide.content ?? slide.bullets ?? [])
      .slice(0, 3)
      .map(b => b.split(' ').slice(0, 8).join(' '))
      .join('\n• ')
    const visual = (slide.visualSuggestion || slide.suggestedVisual || '').slice(0, 55)
    return [
      `[${i + 1}] ${label}`,
      msg ? `"${msg}"` : '',
      bullets ? `• ${bullets}` : '',
      visual ? `Visual: ${visual}` : '',
    ].filter(Boolean).join('\n')
  }

  const handleCopyCanvaPrompt = (part: 1 | 2) => {
    if (!generated) return
    const primary = branding.colors[0] || '#002d62'
    const font = branding.fonts[0] || 'Inter'
    const LIMIT = 3750 // extra buffer below 3800

    const slides = generated.slides
    const half = Math.ceil(slides.length / 2)
    const chunk = part === 1 ? slides.slice(0, half) : slides.slice(half)
    const startIdx = part === 1 ? 0 : half

    const header = part === 1
      ? `Pitch deck for ${companyName} — Part 1 (slides 1-${half}).\nColor: ${primary} | Font: ${font} | Style: clean, minimal, investor-ready.\nRules: max 8 words/bullet, every slide needs a visual, brand color on headers.\nMarket Size: TAM→SAM→SOM circles. Competition: comparison chart required.\n\n`
      : `Continue pitch deck for ${companyName} — Part 2 (slides ${half + 1}-${slides.length}).\nSame brand: ${primary}, ${font}. Match Part 1 style exactly.\nFinancials: 3-year chart with breakeven highlighted. Ask: capital amount + use of funds.\n\n`

    // Add slides one at a time — never cut mid-slide
    let prompt = header
    for (let i = 0; i < chunk.length; i++) {
      const block = buildCompactSlideBlock(chunk[i], startIdx + i) + '\n\n'
      if ((prompt + block).length > LIMIT) break
      prompt += block
    }

    // Final hard cap — trim at last newline before 3800
    prompt = prompt.trimEnd()
    if (prompt.length > 3800) {
      const cutoff = prompt.lastIndexOf('\n', 3800)
      prompt = prompt.slice(0, cutoff > 0 ? cutoff : 3800).trimEnd()
    }

    navigator.clipboard.writeText(prompt)
    setCanvaPromptCopied(part)
    setTimeout(() => setCanvaPromptCopied(null), 2500)
  }

  const handleSave = async () => {
    if (!userId) {
      router.push('/auth')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          answers,
          branding,
          generated,
          mode,
          companyName: answers.company_name || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSessionId(data.id)
        const url = `${window.location.origin}/decks/${data.id}`
        setShareUrl(url)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyShare = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, branding, mode }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'done') setGenerated(event.output)
          if (event.type === 'error') throw new Error(event.message)
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => router.push('/questionnaire')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* Company name */}
          <div className="flex items-center gap-2">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo} alt="Logo" className="h-7 w-auto object-contain" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: branding.colors[0] || '#002d62' }}
              >
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-gray-800 text-sm truncate max-w-[160px]">
              {companyName}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 mx-auto">
            <button
              onClick={() => setActiveTab('deck')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'deck'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layout size={14} />
              Pitch Deck
            </button>
            <button
              onClick={() => setActiveTab('talktrack')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'talktrack'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎤 Talk Track
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <ModeToggle mode={mode} onChange={setMode} size="sm" />
            {!userId && (
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <User size={14} />
                <span className="hidden sm:inline">Login to save</span>
              </button>
            )}
            {userId && !shareUrl && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-all disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            )}
            {shareUrl && (
              <button
                onClick={handleCopyShare}
                className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Canva error banner */}
        {canvaError && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <span>⚠️</span>
            <span>{canvaError}</span>
            <button onClick={() => setCanvaError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'deck' ? '12-Slide Pitch Deck' : 'Talk Track & Script'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeTab === 'deck'
                ? `${generated.slides.length} slides with design notes • Click any slide to expand`
                : 'Full script + improvements + coach notes'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ExportButtons
              output={generated}
              branding={branding}
              companyName={companyName}
            />
            {/* Copy Canva Prompt — Part 1 */}
            <button
              onClick={() => handleCopyCanvaPrompt(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm border border-brand-600 text-brand-600 hover:bg-brand-50 transition-all"
            >
              {canvaPromptCopied === 1 ? <Check size={14} /> : <ExternalLink size={14} />}
              {canvaPromptCopied === 1 ? 'Copied!' : 'Canva Prompt 1'}
            </button>
            {/* Copy Canva Prompt — Part 2 */}
            <button
              onClick={() => handleCopyCanvaPrompt(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm border border-brand-600 text-brand-600 hover:bg-brand-50 transition-all"
            >
              {canvaPromptCopied === 2 ? <Check size={14} /> : <ExternalLink size={14} />}
              {canvaPromptCopied === 2 ? 'Copied!' : 'Canva Prompt 2'}
            </button>
            {/* Open in Canva */}
            <button
              onClick={handleOpenInCanva}
              disabled={canvaLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm bg-brand-600 hover:bg-brand-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {canvaLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ExternalLink size={14} />
              )}
              {canvaLoading ? 'Opening Canva...' : 'Open in Canva'}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm border border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <Zap size={14} />
              )}
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Pitch Deck Tab */}
        {activeTab === 'deck' && (
          <div>
            {/* Color palette preview */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Brand palette:</span>
              <div className="flex gap-2">
                {branding.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                    <span className="text-xs text-gray-400 font-mono hidden sm:inline">{c}</span>
                  </div>
                ))}
              </div>
              {branding.fonts.length > 0 && (
                <span className="text-xs text-gray-400 ml-auto hidden sm:block">
                  Fonts: {branding.fonts.join(', ')}
                </span>
              )}
              <button
                onClick={() => setAllExpanded(!allExpanded)}
                className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {allExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            {/* Slides grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {generated.slides.map((slide, i) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  index={i}
                  branding={branding}
                  isExpanded={allExpanded}
                  companyName={companyName}
                />
              ))}
            </div>

            {/* Quick improvements inline */}
            {generated.quickImprovements.length > 0 && (
              <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  ⚡ Quick Improvements
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-normal">
                    {generated.quickImprovements.length} items
                  </span>
                </h3>
                <div className="space-y-2">
                  {generated.quickImprovements.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <span className="font-bold flex-shrink-0">{i + 1}.</span>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/questionnaire')}
                    className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    <Edit2 size={14} />
                    Go back and improve my answers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Talk Track Tab */}
        {activeTab === 'talktrack' && (
          <TalkTrackPanel
            talkTrack={generated.talkTrack}
            slides={generated.slides}
            quickImprovements={generated.quickImprovements}
            coachNotes={generated.coachNotes}
          />
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <p>Powered by Connect.AI</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/questionnaire')}
              className="flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              <Edit2 size={13} />
              Edit answers
            </button>
            <button
              onClick={() => router.push('/')}
              className="hover:text-gray-600 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
