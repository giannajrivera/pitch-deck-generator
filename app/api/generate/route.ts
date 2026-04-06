import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { BrandingProfile, GeneratedOutput, PitchDeckSlide } from '@/lib/types'
import { buildAnswerSummary } from '@/lib/utils'

export const maxDuration = 60

// SSE helpers
const encoder = new TextEncoder()
function sseEvent(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

const pitchDeckSchema = {
  type: SchemaType.OBJECT,
  properties: {
    slides: {
      type: SchemaType.ARRAY,
      description: 'Exactly 12 slides in order: intro, problem, solution, product, market, businessModel, traction, competition, gtm, financials, team, ask',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: 'Slide identifier — one of: intro, problem, solution, product, market, businessModel, traction, competition, gtm, financials, team, ask',
            nullable: false,
          },
          title: {
            type: SchemaType.STRING,
            description: 'Short, punchy slide title (4-8 words max)',
            nullable: false,
          },
          coreMessage: {
            type: SchemaType.STRING,
            description: 'ONE clear sentence — the single most important investor takeaway from this slide. Make it memorable and specific.',
            nullable: false,
          },
          content: {
            type: SchemaType.ARRAY,
            description: '3-5 crisp bullet points (≤12 words each). competition slide MUST include a single-string markdown table with header row, separator row (---), and data rows. financials slide MUST include a single-string markdown table: Year | Revenue | Costs | Profit.',
            items: { type: SchemaType.STRING },
          },
          visualSuggestion: {
            type: SchemaType.STRING,
            description: 'Specific, actionable visual: e.g. "Horizontal bar chart showing 3-year revenue growth" or "2x3 icon grid with feature names"',
            nullable: false,
          },
          layoutSuggestion: {
            type: SchemaType.STRING,
            description: 'Canva layout guide: e.g. "Split layout — left 40% brand color with stat callouts, right 60% white with bullet list" or "Full-bleed hero image with text overlay"',
            nullable: false,
          },
          talkTrack: {
            type: SchemaType.STRING,
            description: '30-60 second spoken script for this slide only. Conversational, founder-authentic. No filler. Start mid-sentence if needed.',
            nullable: false,
          },
        },
        required: ['id', 'title', 'coreMessage', 'content', 'visualSuggestion', 'layoutSuggestion', 'talkTrack'],
      },
    },
    quickImprovements: {
      type: SchemaType.ARRAY,
      description: '4-6 specific, actionable improvements (missing data, weak arguments, vague statements)',
      items: { type: SchemaType.STRING },
    },
    coachNotes: {
      type: SchemaType.ARRAY,
      description: '4-6 insights for workshop facilitators: risks, gaps, follow-up questions, coaching suggestions',
      items: { type: SchemaType.STRING },
    },
  },
  required: ['slides', 'quickImprovements', 'coachNotes'],
}

function buildBrandingContext(branding: BrandingProfile): string {
  const hasCustomBranding = branding.colors.length > 0 || branding.logo || branding.fonts.length > 0

  if (!hasCustomBranding) {
    return `
BRANDING: No custom branding provided. Apply a clean, modern startup aesthetic:
- Colors: Deep violet (#7C3AED) as primary, Indigo (#4F46E5) as secondary, near-white (#F8F7FF) as background
- Fonts: Inter for all text, bold for headlines
- Style: Minimal, professional, data-forward
- Logo: Use company name as text mark until logo is provided
- Tone: Bold and confident`
  }

  return `
BRANDING PROFILE:
- Colors: ${branding.colors.length > 0 ? branding.colors.join(', ') : 'Use defaults (violet #7C3AED)'}
- Fonts: ${branding.fonts.length > 0 ? branding.fonts.join(', ') : 'Inter'}
- Tone: ${branding.tone || 'professional'}
- Style: ${branding.style || 'startup'}
- Company Type: ${branding.companyType || 'tech startup'}
- Logo: ${branding.logo ? 'PROVIDED — reference it in design notes' : 'Not provided — use company name as text'}

Apply this branding consistently across ALL design notes. Every slide's color, typography, and visual style must reflect these brand guidelines.`
}

function buildGenerationPrompt(
  answers: Record<string, string>,
  branding: BrandingProfile,
  mode: 'workshop' | 'solo'
): string {
  const answerSummary = buildAnswerSummary(answers)
  const brandingContext = buildBrandingContext(branding)
  const companyName = answers.company_name || 'this company'
  const industry = answers.industry?.trim() || ''
  const geography = answers.geography?.trim() || 'United States'

  return `You are an expert startup pitch coach, investor relations advisor, and visual deck designer. Generate a world-class, investor-ready pitch deck for ${companyName}.

${brandingContext}

MODE: ${mode === 'workshop' ? 'WORKSHOP — concise, high-impact, optimized for live delivery' : 'SOLO — detailed, thorough, optimized for cold investor sends'}

FOUNDER ANSWERS:
${answerSummary || 'No answers provided — generate a compelling template-style pitch deck with realistic placeholder content.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATION REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CANVA-FIRST OUTPUT RULES (apply to every slide):
   - content bullets MUST be ≤12 words each — no full sentences, no filler
   - coreMessage is the slide headline — make it punchy, specific, memorable
   - visualSuggestion must be actionable: "Concentric circles: TAM $12B → SAM $2.1B → SOM $85M" not just "show market size"
   - layoutSuggestion must guide Canva placement precisely: "Split — left 35% brand-color panel with large stat, right 65% white with 4 bullets"

2. MARKET RESEARCH — AI-ESTIMATED TAM/SAM/SOM (never ask the user for this):
   Industry: ${industry || 'infer from company description and problem'}
   Geography: ${geography}
   - Using your training knowledge of market research reports, industry benchmarks, and comparable companies, estimate defensible TAM/SAM/SOM for this business
   - TAM: Total global (or national) market for this category — cite the research logic (e.g. "US restaurant tech market per IBISWorld/Statista estimates")
   - SAM: The serviceable slice — narrowed by geography, customer segment, and product fit
   - SOM: Realistic 3-5 year capture — based on team size, GTM strategy, and competitive dynamics
   - ALWAYS show the bottom-up math: e.g. "~45K target restaurants × $600 ACV = $27M SOM"
   - Use specific dollar figures. Never use ranges like "$1B-$5B" — pick a defensible number and explain it
   - Flag your confidence level if data is limited: "(estimated — verify with IBISWorld or Statista)"

3. INVESTOR INTELLIGENCE (apply to each slide):
   - PROBLEM: quantify pain in $, hours, or outcomes lost — no vague claims
   - SOLUTION: lead with differentiation ("Unlike X, we..."), not just description
   - TRACTION: best metric first; if pre-revenue, show pilots, LOIs, waitlist, retention
   - TEAM: answer "why THIS team for THIS problem?" — domain expertise + execution track record
   - ASK: connect the ask directly to a specific milestone; show 18-month runway math
   - Use urgency framing where genuine: market timing, regulatory tailwind, competitor gap

4. SLIDES (exactly 12 — in this order):
   - INTRO: Company name + tagline as hero. coreMessage = the one-liner pitch.
   - PROBLEM: Lead with the pain. Quantified, specific, urgent.
   - SOLUTION: Clear differentiation. What you do AND why it's better.
   - PRODUCT: Tangible features that solve the problem directly.
   - MARKET: TAM → SAM → SOM with defensible sizing. Include the math.
   - BUSINESS MODEL: Revenue streams + pricing model. Show unit economics.
   - TRACTION: Best metric first. Show momentum trajectory.
   - COMPETITION: MUST include a markdown comparison table (3-4 columns, 4-5 rows) embedded as a single content item.
   - GTM: 3 specific acquisition channels in priority order with rationale.
   - FINANCIALS: MUST include a markdown table (Year | Revenue | Costs | Profit) showing 3-year path to breakeven.
   - TEAM: Why this team wins. Domain expertise + relevant track record.
   - ASK: Funding amount + use of funds breakdown (% per category) + milestone this unlocks.

5. PER-SLIDE TALK TRACK (30-60 seconds each):
   - Write as the founder speaking — conversational, not scripted-sounding
   - Tone: ${branding.tone || 'bold'} — match the brand personality
   - Open each slide with a hook or transition from prior slide
   - End each slide with a bridge to what's coming next (except the last)
   - ${mode === 'workshop' ? 'Keep each script ≤60 words (fast workshop pace)' : 'Target 80-100 words per slide (investor meeting pace)'}

6. QUICK IMPROVEMENTS:
   - Identify the 4-6 most impactful missing data points
   - Flag vague or unsupported claims
   - Note specific questions investors will ask that the current pitch can't answer

7. COACH NOTES:
   - 4-6 insights for workshop facilitators
   - Red flags investors will probe
   - Specific follow-up questions to push the founder deeper

Generate the complete pitch deck now. Every slide must be specific, compelling, and investor-ready.`
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'GEMINI_API_KEY is not configured.' })}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  let body: { answers: Record<string, string>; branding: BrandingProfile; mode: 'workshop' | 'solo' }
  try {
    body = await req.json()
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Invalid request body.' })}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const { answers, branding, mode } = body
  const prompt = buildGenerationPrompt(answers, branding, mode)

  const readable = new ReadableStream({
    async start(controller) {
      // Time-based keepalive every 4s — keeps the connection alive while
      // Gemini is thinking/buffering (structured output often buffers fully before streaming).
      const keepalive = setInterval(() => {
        try { sseEvent(controller, { type: 'token', content: '' }) } catch { /* stream closing */ }
      }, 4000)

      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: pitchDeckSchema,
          } as any,
        })

        const result = await model.generateContentStream(prompt)

        let fullText = ''
        for await (const chunk of result.stream) {
          fullText += chunk.text()
        }

        clearInterval(keepalive)

        // Strip any thinking-token preamble before the JSON object
        const jsonStart = fullText.indexOf('{')
        const jsonText = jsonStart >= 0 ? fullText.slice(jsonStart) : fullText

        let output: GeneratedOutput
        try {
          output = JSON.parse(jsonText) as GeneratedOutput
        } catch {
          sseEvent(controller, { type: 'error', message: 'Failed to parse AI output. Please try again.' })
          await new Promise<void>((r) => setTimeout(r, 50))
          controller.close()
          return
        }

        // Fill in any missing slides
        if (!output.slides || output.slides.length < 12) {
          const existingIds = new Set<string>(output.slides?.map((s: PitchDeckSlide) => s.id) || [])
          const requiredIds = ['intro', 'problem', 'solution', 'product', 'market', 'businessModel', 'traction', 'competition', 'gtm', 'financials', 'team', 'ask']
          for (const id of requiredIds) {
            if (!existingIds.has(id)) {
              output.slides = output.slides || []
              output.slides.push({
                id: id as PitchDeckSlide['id'],
                title: id.charAt(0).toUpperCase() + id.slice(1),
                coreMessage: 'Content coming soon — please re-generate',
                content: ['Re-generate to populate this slide'],
                visualSuggestion: 'To be determined',
                layoutSuggestion: 'Standard layout',
                talkTrack: '',
              })
            }
          }
        }

        sseEvent(controller, { type: 'done', output })
        // Yield to the event loop so the done event is flushed before close
        await new Promise<void>((r) => setTimeout(r, 50))
        controller.close()
      } catch (error) {
        clearInterval(keepalive)
        console.error('Generation error:', error)
        const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
        try {
          sseEvent(controller, { type: 'error', message })
          await new Promise<void>((r) => setTimeout(r, 50))
        } catch { /* ignore if stream already closed */ }
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
