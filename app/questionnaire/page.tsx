'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Zap, RotateCcw } from 'lucide-react'
import {
  useStore,
  useAnswers,
  useCurrentIndex,
  useMode,
  useBranding,
  useIsGenerating,
  useGenerationError,
  useGenerated,
  useUserId,
} from '@/lib/store'
import { QUESTIONS } from '@/lib/questions'
import { buildAnswerSummary } from '@/lib/utils'
import { QuestionCard } from '@/components/QuestionCard'
import { ProgressBar, SlideIndicator } from '@/components/ProgressBar'
import { ModeToggle } from '@/components/ModeToggle'

export default function QuestionnairePage() {
  const router = useRouter()

  const {
    setAnswer,
    nextQuestion,
    prevQuestion,
    setMode,
    setGenerated,
    setIsGenerating,
    setGenerationError,
    setSessionId,
  } = useStore()

  const answers = useAnswers()
  const currentIndex = useCurrentIndex()
  const mode = useMode()
  const branding = useBranding()
  const isGenerating = useIsGenerating()
  const generationError = useGenerationError()
  const generated = useGenerated()
  const userId = useUserId()

  const [isImprovingAnswer, setIsImprovingAnswer] = useState(false)
  const [improveError, setImproveError] = useState<string | null>(null)

  const currentQuestion = QUESTIONS[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] || ''

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (currentQuestion) {
        setAnswer(currentQuestion.id, value)
      }
    },
    [currentQuestion, setAnswer]
  )

  const handleNext = useCallback(() => {
    if (currentIndex === QUESTIONS.length - 1) {
      handleGenerate()
    } else {
      nextQuestion()
    }
  }, [currentIndex, nextQuestion])

  const handleSkip = useCallback(() => {
    nextQuestion()
  }, [nextQuestion])

  const handleImproveAnswer = useCallback(async () => {
    if (!currentQuestion) return
    setIsImprovingAnswer(true)
    setImproveError(null)

    try {
      // Build context from other answers
      const context = buildAnswerSummary(answers)

      const res = await fetch('/api/improve-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          currentAnswer,
          context,
          mode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to improve answer')

      setAnswer(currentQuestion.id, data.improvedAnswer)
    } catch (err) {
      setImproveError(err instanceof Error ? err.message : 'Failed to improve answer')
    } finally {
      setIsImprovingAnswer(false)
    }
  }, [currentQuestion, currentAnswer, answers, mode, setAnswer])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError(null)

    let completed = false

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
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'done') {
              completed = true
              setGenerated(event.output)
              // Auto-save to Supabase if logged in
              if (userId) {
                fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    answers,
                    branding,
                    generated: event.output,
                    mode,
                    companyName: answers.company_name || null,
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => { if (d.id) setSessionId(d.id) })
                  .catch(() => {}) // non-critical
              }
              router.push('/output')
            } else if (event.type === 'error') {
              setGenerationError(event.message)
              setIsGenerating(false)
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      if (!completed) {
        setGenerationError('Generation did not complete. Please try again.')
        setIsGenerating(false)
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 size={36} className="text-brand-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Building your pitch deck...
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Claude is generating your 12-slide deck, talk track, and design notes.
              This usually takes 20–40 seconds.
            </p>
            <div className="space-y-2 text-left">
              {[
                '✍️ Writing slide content...',
                '🎨 Applying your branding...',
                '🎤 Crafting your talk track...',
                '💡 Generating design notes...',
                '🔍 Identifying improvements...',
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="opacity-75">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (generationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-10">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Generation failed</h2>
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-6 leading-relaxed">
              {generationError}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-xl hover:bg-brand-700 transition-all"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <button
                onClick={() => { setGenerationError(null) }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Edit Answers
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-gray-100 flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-bold text-gray-800">Connect.AI</span>
          </div>
          <ProgressBar variant="minimal" />
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Slides</p>
          <SlideIndicator />
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all text-sm"
          >
            <Zap size={14} />
            Generate Now
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex-1 lg:hidden">
            <ProgressBar variant="minimal" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ModeToggle mode={mode} onChange={setMode} size="sm" />
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-8 py-8 sm:py-12">
          <div className="w-full max-w-2xl">
            <QuestionCard
              question={currentQuestion}
              answer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              onNext={handleNext}
              onPrev={() => prevQuestion()}
              onSkip={handleSkip}
              onImprove={handleImproveAnswer}
              canGoNext={true}
              canGoPrev={currentIndex > 0}
              isImprovingAnswer={isImprovingAnswer}
              mode={mode}
              improveError={improveError}
              totalQuestions={QUESTIONS.length}
              currentIndex={currentIndex}
            />
          </div>
        </div>

        {/* Mobile generate button */}
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3">
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all text-sm"
          >
            <Zap size={14} />
            Generate My Pitch Deck
          </button>
        </div>
      </main>
    </div>
  )
}
