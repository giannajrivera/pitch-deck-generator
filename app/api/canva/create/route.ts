import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import PptxGenJS from 'pptxgenjs'
import type { GeneratedOutput, BrandingProfile } from '@/lib/types'

function hexToClean(hex: string): string {
  return hex.replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6)
}

async function buildPptx(
  output: GeneratedOutput,
  branding: BrandingProfile,
  companyName: string
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.layout = 'WIDE' // 13.33" x 7.5"

  const primaryHex = hexToClean(branding.colors[0] || '#7C3AED')
  const secondaryHex = hexToClean(branding.colors[1] || '#4F46E5')
  const fontFace = branding.fonts[0] || 'Calibri'

  for (const slide of output.slides) {
    const s = pptx.addSlide()
    s.background = { color: 'FFFFFF' }

    // Header bar
    s.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 1.1,
      fill: { color: primaryHex },
      line: { color: primaryHex },
    })

    // Slide title
    s.addText(slide.title, {
      x: 0.4, y: 0.15, w: 12.5, h: 0.8,
      fontSize: 22, bold: true, color: 'FFFFFF',
      fontFace, valign: 'middle',
    })

    // Core message bar
    if (slide.coreMessage) {
      s.addShape(pptx.ShapeType.rect, {
        x: 0, y: 1.1, w: '100%', h: 0.55,
        fill: { color: 'F5F3FF' },
        line: { color: 'EDE9FE' },
      })
      s.addText(slide.coreMessage, {
        x: 0.4, y: 1.13, w: 12.5, h: 0.5,
        fontSize: 13, italic: true, color: '5B21B6',
        fontFace, valign: 'middle',
      })
    }

    // Content bullets
    const bullets = slide.content ?? slide.bullets ?? []
    if (bullets.length > 0) {
      s.addText(
        bullets.map((b) => ({ text: b, options: { bullet: { indent: 15 } } })),
        {
          x: 0.4, y: 1.8, w: 12.5, h: 4.6,
          fontSize: 14, color: '1F2937',
          fontFace, valign: 'top', lineSpacingMultiple: 1.4,
        }
      )
    }

    // Visual suggestion note (footer)
    const visual = slide.visualSuggestion || slide.suggestedVisual
    if (visual) {
      s.addShape(pptx.ShapeType.rect, {
        x: 0, y: 6.8, w: '100%', h: 0.7,
        fill: { color: 'F9FAFB' },
        line: { color: 'E5E7EB' },
      })
      s.addText(`Visual: ${visual}`, {
        x: 0.4, y: 6.83, w: 12.5, h: 0.6,
        fontSize: 9, color: '9CA3AF', italic: true, fontFace,
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pptx.write({ outputType: 'nodebuffer' }) as any
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('canva_access_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { output, branding, companyName } = (await req.json()) as {
    output: GeneratedOutput
    branding: BrandingProfile
    companyName: string
  }

  // Build PPTX in memory
  const pptxBuffer = await buildPptx(output, branding, companyName)

  // Upload to Canva via Design Import API
  const form = new FormData()
  form.append('title', `${companyName} Pitch Deck`)
  form.append(
    'asset',
    new Blob([new Uint8Array(pptxBuffer)], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }),
    `${companyName.replace(/\s+/g, '_')}_pitch_deck.pptx`
  )

  const importRes = await fetch('https://api.canva.com/rest/v1/imports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!importRes.ok) {
    const err = await importRes.text()
    console.error('Canva import failed:', err)
    return NextResponse.json({ error: 'import_failed', details: err }, { status: 500 })
  }

  const { job } = await importRes.json()
  return NextResponse.json({ jobId: job.id })
}
