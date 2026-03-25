import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { BrandingProfile } from '@/lib/types'

const brandingSchema = {
  type: SchemaType.OBJECT,
  properties: {
    colors: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2-4 hex color codes extracted from the website',
    },
    fonts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Font family names found in the website CSS',
    },
    tone: {
      type: SchemaType.STRING,
      description: 'One of: formal, playful, bold, minimal, technical',
      nullable: false,
    },
    style: {
      type: SchemaType.STRING,
      description: 'One of: corporate, startup, creative, minimal',
      nullable: false,
    },
    companyType: {
      type: SchemaType.STRING,
      description: 'e.g. SaaS, Marketplace, Consumer App, Hardware, Services',
      nullable: false,
    },
  },
  required: ['colors', 'fonts', 'tone', 'style', 'companyType'],
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    // Fetch the webpage
    let pageContent = ''
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const pageResponse = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PitchDeckGenerator/1.0)' },
      })
      clearTimeout(timeoutId)
      pageContent = (await pageResponse.text()).slice(0, 20000)
    } catch {
      return NextResponse.json(
        { error: `Could not fetch website at ${normalizedUrl}. The site may be unavailable or blocking requests.` },
        { status: 400 }
      )
    }

    const prompt = `Analyze this website's HTML/content and extract branding information.

URL: ${normalizedUrl}
PAGE CONTENT (truncated):
${pageContent}

Extract the branding: hex colors from CSS/styles, font family names, tone of the copy, overall design style, and company type. If you cannot determine something, make a reasonable inference based on the industry/company type. Always return at least 2 colors and 1 font.`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: brandingSchema,
      },
    })

    const result = await model.generateContent(prompt)
    const extracted = JSON.parse(result.response.text()) as Partial<BrandingProfile>

    return NextResponse.json({
      colors: extracted.colors?.length ? extracted.colors : ['#7C3AED', '#5B21B6'],
      fonts: extracted.fonts?.length ? extracted.fonts : ['Inter'],
      tone: extracted.tone || 'bold',
      style: extracted.style || 'startup',
      companyType: extracted.companyType || '',
    })
  } catch (error) {
    console.error('Extract branding error:', error)
    return NextResponse.json({ error: 'Failed to extract branding. Please try again.' }, { status: 500 })
  }
}
