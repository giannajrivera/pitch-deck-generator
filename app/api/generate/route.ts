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
    talkTrack: {
      type: SchemaType.STRING,
      description: '3-5 minute speaker script (450-750 words). Conversational, persuasive, founder-authentic tone.',
      nullable: false,
    },
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
          bullets: {
            type: SchemaType.ARRAY,
            description: '3-5 bullet points. Slide competition must contain a markdown table. Slide financials must contain a markdown table: Year | Revenue | Costs | Profit.',
            items: { type: SchemaType.STRING },
          },
          suggestedVisual: {
            type: SchemaType.STRING,
            description: 'Specific visual element recommendation',
            nullable: false,
          },
          designNotes: {
            type: SchemaType.OBJECT,
            properties: {
              layout: { type: SchemaType.STRING, nullable: false },
              colorUsage: { type: SchemaType.STRING, nullable: false },
              fontHierarchy: { type: SchemaType.STRING, nullable: false },
              logoPlacement: { type: SchemaType.STRING, nullable: false },
              visualStyle: { type: SchemaType.STRING, nullable: false },
            },
            required: ['layout', 'colorUsage', 'fontHierarchy', 'logoPlacement', 'visualStyle'],
          },
        },
        required: ['id', 'title', 'bullets', 'suggestedVisual', 'designNotes'],
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
  required: ['talkTrack', 'slides', 'quickImprovements', 'coachNotes'],
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

  return `You are an expert startup pitch coach, investor relations advisor, and brand designer. Your task is to generate a world-class pitch deck and talk track for ${companyName}.

${brandingContext}

MODE: ${mode === 'workshop' ? 'WORKSHOP (concise, high-impact, fast delivery)' : 'SOLO (detailed, thorough, investor-ready)'}

FOUNDER ANSWERS:
${answerSummary || 'No answers provided — generate a template-style pitch deck with placeholder content.'}

REQUIREMENTS FOR GENERATION:

1. TALK TRACK (3-5 min script):
   - Write as the founder speaking directly to investors
   - Tone must match the branding profile (${branding.tone || 'bold'})
   - Flow naturally through all 12 slides
   - Open with a hook. Close with a clear call to action.
   - ${mode === 'workshop' ? 'Keep to 3 minutes max (≈400 words)' : 'Aim for 4-5 minutes (≈600-750 words)'}

2. SLIDES (exactly 12):
   - INTRO: Strong identity, tagline front-and-center
   - PROBLEM: Lead with the pain. Use specific numbers if provided.
   - SOLUTION: Clear differentiation. Not just what you do, but WHY it's better.
   - PRODUCT: Tangible features. Make it feel real.
   - MARKET: Show TAM/SAM/SOM as a clear progression. Include market data.
   - BUSINESS MODEL: Clear monetization. Show revenue math.
   - TRACTION: Lead with the best metric. If limited, show momentum.
   - COMPETITION: MUST INCLUDE a comparison table (markdown format) with 3-4 dimensions.
   - GTM: Specific channels. Show priority order and rationale.
   - FINANCIALS: MUST INCLUDE a revenue table (Year | Revenue | Costs | Profit). Show path to breakeven.
   - TEAM: Emphasize why this team is uniquely qualified to solve this problem.
   - ASK: Specific funding amount, use of funds breakdown, key milestone this achieves.

3. DESIGN NOTES (for each slide):
   - Be specific about layout, not generic
   - Reference actual brand colors by hex code
   - Describe exact font sizes and weights for headline vs body
   - Specify logo placement (top-left corner, bottom-right watermark, etc.)
   - Describe the visual mood/style this slide should convey

4. QUICK IMPROVEMENTS:
   - Identify missing data points that weaken the pitch
   - Flag any slides where claims are unsupported
   - Suggest specific questions the founder should be able to answer

5. COACH NOTES:
   - Insights for workshop facilitators
   - Questions to push the founder deeper
   - Red flags investors will likely probe

Generate the pitch deck now. Be specific, compelling, and investor-ready.`
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
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: pitchDeckSchema,
          },
        })

        // Use generateContent (non-streaming) to avoid thinking-token contamination
        // with gemini-2.5-flash's thinking mode in streaming responses
        const result = await model.generateContent(prompt)
        const fullText = result.response.text()

        let output: GeneratedOutput
        try {
          output = JSON.parse(fullText) as GeneratedOutput
        } catch {
          sseEvent(controller, { type: 'error', message: 'Failed to parse output. Please try again.' })
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
                bullets: ['Content coming soon — please re-generate'],
                suggestedVisual: 'Placeholder',
                designNotes: {
                  layout: 'Standard layout',
                  colorUsage: 'Use brand primary color',
                  fontHierarchy: 'Standard heading + body',
                  logoPlacement: 'Top-left corner',
                  visualStyle: 'Clean and minimal',
                },
              })
            }
          }
        }

        sseEvent(controller, { type: 'done', output })
        controller.close()
      } catch (error) {
        console.error('Generation error:', error)
        const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
        sseEvent(controller, { type: 'error', message })
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
