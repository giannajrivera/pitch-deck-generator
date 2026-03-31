'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { cn, getContrastColor } from '@/lib/utils'
import type { PitchDeckSlide, BrandingProfile } from '@/lib/types'

// ── Data parsers ───────────────────────────────────────────────────────────

function parseMarketSizes(bullets: string[]) {
  const text = bullets.join(' ')
  const result: { label: string; formatted: string; value: number }[] = []
  for (const [label, re] of [
    ['TAM', /TAM\b[^$\d]{0,10}\$?\s*([\d,.]+)\s*([BMKTbmkt])?/],
    ['SAM', /SAM\b[^$\d]{0,10}\$?\s*([\d,.]+)\s*([BMKbmk])?/],
    ['SOM', /SOM\b[^$\d]{0,10}\$?\s*([\d,.]+)\s*([BMKbmk])?/],
  ] as [string, RegExp][]) {
    const m = text.match(re)
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''))
      const mult: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 }
      const v = n * (mult[(m[2] || '').toUpperCase()] || 1)
      result.push({ label, formatted: `$${m[1]}${m[2] || ''}`, value: v })
    }
  }
  return result
}

function parseMarkdownTable(bullets: string[]) {
  const t = bullets.find(b => b.includes('|') && b.includes('---'))
  if (!t) return null
  const lines = t.trim().split('\n').filter(l => l.trim() && !l.match(/^[\s|:-]+$/))
  if (lines.length < 2) return null
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean)
  const rows = lines.slice(1).map(row => row.split('|').map(c => c.trim()).filter(Boolean))
  return { headers, rows: rows.filter(r => r.length > 0) }
}

function parseUseOfFunds(bullets: string[]) {
  const result: { label: string; pct: number }[] = []
  for (const b of bullets) {
    const m1 = b.match(/^([A-Za-z][^:]{2,40}):\s*(\d+)%/)
    const m2 = b.match(/(\d+)%[^a-z]*([A-Za-z].{3,35})/)
    if (m1) result.push({ label: m1[1].trim(), pct: parseInt(m1[2]) })
    else if (m2) result.push({ label: m2[2].trim().split(/[,.(]/)[0], pct: parseInt(m2[1]) })
  }
  return result
}

function extractFundingAmount(bullets: string[]) {
  const text = bullets.join(' ')
  const m = text.match(/\$\s*([\d,.]+)\s*([BMKbmk])?(?=\s*(?:million|billion|seed|pre|raise|round|ask|m\b|b\b))?/i)
  return m ? `$${m[1]}${m[2] || ''}` : null
}

function toNum(s: string): number {
  const m = s.replace(/,/g, '').match(/([\d.]+)\s*([BMKbmk])?/)
  if (!m) return 0
  const mult: Record<string, number> = { B: 1e9, M: 1e6, K: 1e3 }
  return parseFloat(m[1]) * (mult[(m[2] || '').toUpperCase()] || 1)
}

// ── SVG Charts ─────────────────────────────────────────────────────────────

function DonutChart({ segments, size = 96 }: {
  segments: { pct: number; color: string }[]
  size?: number
}) {
  const r = size / 2 - 6
  const cx = size / 2
  const cy = size / 2
  let cum = 0
  const paths = segments.filter(s => s.pct > 0).map(s => {
    const s1 = ((cum / 100) * 360 - 90) * (Math.PI / 180)
    cum += s.pct
    const e1 = ((cum / 100) * 360 - 90) * (Math.PI / 180)
    const sx = cx + r * Math.cos(s1), sy = cy + r * Math.sin(s1)
    const ex = cx + r * Math.cos(e1), ey = cy + r * Math.sin(e1)
    return { ...s, d: `M${cx},${cy} L${sx},${sy} A${r},${r} 0 ${s.pct > 50 ? 1 : 0},1 ${ex},${ey} Z` }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.88} />)}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="white" />
    </svg>
  )
}

function BarChart({ data, colors, w = 200, h = 80 }: {
  data: { label: string; raw: string }[]
  colors: string[]
  w?: number
  h?: number
}) {
  const vals = data.map(d => toNum(d.raw))
  const max = Math.max(...vals, 1)
  const bw = Math.max(8, (w - 12 - data.length * 5) / data.length)
  const availH = h - 18
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((d, i) => {
        const bh = Math.max(2, (vals[i] / max) * availH)
        const x = 6 + i * (bw + 5)
        const y = availH - bh + 2
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={colors[i % colors.length]} rx={2} opacity={0.85} />
            <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize="7" fill="#9ca3af" fontFamily="sans-serif">
              {d.label.replace('Year ', 'Y').slice(0, 4)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Shared props ───────────────────────────────────────────────────────────

interface BodyProps {
  slide: PitchDeckSlide
  primary: string
  secondary: string
  accent: string
  onPrimary: string
  logo: string | null
  companyName: string
}

// ── Slide body components ──────────────────────────────────────────────────

function IntroBody({ slide, primary, secondary, onPrimary, logo, companyName }: BodyProps) {
  const sub = slide.bullets[0] || slide.title
  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6 py-4 text-center gap-2"
      style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
    >
      {logo && <img src={logo} alt="" className="h-8 w-auto object-contain opacity-90 mb-1" />}
      <h2 className="text-xl font-black tracking-tight leading-tight" style={{ color: onPrimary }}>
        {companyName}
      </h2>
      <p className="text-xs font-medium opacity-75 max-w-[220px] leading-snug" style={{ color: onPrimary }}>
        {sub}
      </p>
      <div className="w-8 h-0.5 rounded-full opacity-40 mt-1" style={{ backgroundColor: onPrimary }} />
    </div>
  )
}

function BulletBody({ slide, primary }: BodyProps) {
  const isProb = slide.id === 'problem'
  const isSol = slide.id === 'solution'
  const accent = isProb ? '#ef4444' : isSol ? '#10b981' : primary
  const bg = isProb ? '#fef2f2' : isSol ? '#f0fdf4' : `${primary}0D`
  return (
    <ul className="p-3 space-y-1.5 h-full overflow-hidden">
      {slide.bullets.slice(0, 4).map((b, i) => (
        <li key={i} className="flex items-start gap-2 rounded-lg p-2 text-[11px] leading-snug" style={{ backgroundColor: bg }}>
          <span
            className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >{i + 1}</span>
          <span className="text-gray-700 line-clamp-2">{b}</span>
        </li>
      ))}
    </ul>
  )
}

function MarketBody({ slide, primary, secondary, accent }: BodyProps) {
  const sizes = parseMarketSizes(slide.bullets)
  if (sizes.length < 2) return <BulletBody {...{ slide, primary, secondary, accent, onPrimary: '#fff', logo: null, companyName: '' }} />

  const [tam, sam, som] = ['TAM', 'SAM', 'SOM'].map(l => sizes.find(s => s.label === l))
  const bubbleColors = [`${primary}20`, `${primary}38`, `${primary}60`]

  return (
    <div className="flex items-center justify-center h-full gap-5 px-4 py-3">
      {/* Bubble visual */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        {[88, 64, 42].map((sz, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ width: sz, height: sz, backgroundColor: bubbleColors[i], border: `1.5px solid ${primary}30` }}
          />
        ))}
        <span className="relative z-10 text-[9px] font-black text-white" style={{ textShadow: `0 1px 2px ${primary}` }}>
          SOM
        </span>
      </div>
      {/* Labels */}
      <div className="space-y-2.5">
        {[tam, sam, som].map((s, i) => s && (
          <div key={i} className="flex items-center gap-2" style={{ opacity: 0.5 + i * 0.25 }}>
            <span className="text-[10px] font-bold w-6 uppercase" style={{ color: primary }}>{s.label}</span>
            <span className="text-sm font-black text-gray-800">{s.formatted}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TractionBody({ slide, primary }: BodyProps) {
  const metrics = slide.bullets.slice(0, 4).map(b => {
    const m = b.match(/^([^:]+?):\s*([^\s,.(]{1,25})/)
    if (m) return { label: m[1].trim(), value: m[2].trim() }
    const num = b.match(/(\$[\d,.]+[BMKk]?|\d[\d,.]+[%x+]?|\d{4,}[+]?)/)
    return { label: b.replace(/[^a-zA-Z\s]/g, '').trim().slice(0, 28), value: num?.[0] || '—' }
  })
  return (
    <div className="grid grid-cols-2 gap-2 p-3 h-full">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="rounded-xl p-2 flex flex-col justify-center items-center text-center"
          style={{ backgroundColor: `${primary}12` }}
        >
          <div className="text-base font-black leading-none" style={{ color: primary }}>{m.value}</div>
          <div className="text-[9px] text-gray-500 mt-1 line-clamp-2 leading-tight">{m.label}</div>
        </div>
      ))}
    </div>
  )
}

function CompetitionBody({ slide, primary }: BodyProps) {
  const table = parseMarkdownTable(slide.bullets)
  if (!table) return <BulletBody {...{ slide, primary, secondary: primary, accent: primary, onPrimary: '#fff', logo: null, companyName: '' }} />
  return (
    <div className="p-2 h-full overflow-auto">
      <table className="w-full text-[9px] border-collapse">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="px-1.5 py-1 text-left font-semibold text-white" style={{ backgroundColor: i === 0 ? primary : `${primary}CC` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.slice(0, 5).map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              {row.map((cell, ci) => (
                <td key={ci} className={cn('px-1.5 py-0.5 text-gray-700 border-b border-gray-100', ci === 0 ? 'font-semibold' : '')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinancialsBody({ slide, primary, secondary, accent }: BodyProps) {
  const table = parseMarkdownTable(slide.bullets)
  if (!table) return <BulletBody {...{ slide, primary, secondary, accent, onPrimary: '#fff', logo: null, companyName: '' }} />
  const chartData = table.rows.map(r => ({ label: r[0] || '', raw: r[1] || '0' }))
  return (
    <div className="p-3 h-full flex flex-col gap-2">
      <BarChart data={chartData} colors={[primary, secondary, accent, `${primary}99`]} />
      <div className="flex-1 overflow-hidden">
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr>{table.headers.map((h, i) => (
              <th key={i} className="px-1 py-0.5 text-left font-semibold text-white" style={{ backgroundColor: primary }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {table.rows.slice(0, 3).map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-1 py-0.5 text-gray-700 border-b border-gray-100">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AskBody({ slide, primary, secondary, accent }: BodyProps) {
  const funds = parseUseOfFunds(slide.bullets).filter(f => f.pct > 0).slice(0, 5)
  const amount = extractFundingAmount(slide.bullets)
  const colors = [primary, secondary, accent, '#f59e0b', '#10b981']

  return (
    <div className="flex items-center gap-3 p-3 h-full">
      {amount && (
        <div className="text-center flex-shrink-0">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Raising</p>
          <p className="text-2xl font-black leading-tight" style={{ color: primary }}>{amount}</p>
        </div>
      )}
      {funds.length > 0 ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DonutChart segments={funds.map((f, i) => ({ pct: f.pct, color: colors[i % colors.length] }))} size={84} />
          <div className="space-y-1 flex-1 min-w-0">
            {funds.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-[9px] text-gray-600 truncate flex-1">{f.label}</span>
                <span className="text-[9px] font-bold text-gray-800">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex-1 space-y-1">
          {slide.bullets.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: primary }} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TeamBody({ slide, primary }: BodyProps) {
  const members = slide.bullets.slice(0, 4).map(b => {
    const m = b.match(/^([^,:\n]+)[,:\s–-]+\s*(.{3,50})/)
    return m
      ? { name: m[1].trim(), role: m[2].trim().split(/[.,]/)[0].slice(0, 36) }
      : { name: b.slice(0, 28), role: '' }
  })
  return (
    <div className="grid grid-cols-2 gap-2 p-3 h-full">
      {members.map((m, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl p-2" style={{ backgroundColor: `${primary}0F` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white" style={{ backgroundColor: primary }}>
            {m.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-800 truncate">{m.name}</p>
            <p className="text-[9px] text-gray-500 truncate">{m.role}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function GTMBody({ slide, primary }: BodyProps) {
  return (
    <div className="p-3 h-full flex flex-col gap-1.5 justify-center">
      {slide.bullets.slice(0, 3).map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 text-[9px] font-black text-white" style={{ backgroundColor: primary }}>
            {i + 1}
          </div>
          <p className="flex-1 rounded-lg p-1.5 text-[10px] text-gray-700 leading-snug" style={{ backgroundColor: `${primary}0D` }}>
            {b}
          </p>
        </div>
      ))}
    </div>
  )
}

function BizModelBody({ slide, primary }: BodyProps) {
  return (
    <div className="p-3 h-full flex flex-col gap-1.5 justify-center">
      {slide.bullets.slice(0, 4).map((b, i) => {
        const m = b.match(/^([^:]+):\s*(.+)/)
        return (
          <div key={i} className="flex items-start gap-2 rounded-lg p-2" style={{ backgroundColor: `${primary}0D` }}>
            <div className="w-1 h-full min-h-[14px] rounded-full flex-shrink-0" style={{ backgroundColor: primary }} />
            {m ? (
              <p className="text-[10px] text-gray-700 leading-snug">
                <span className="font-bold text-gray-800">{m[1]}: </span>{m[2]}
              </p>
            ) : (
              <p className="text-[10px] text-gray-700 leading-snug">{b}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Slide body registry ────────────────────────────────────────────────────

type BodyComponent = (props: BodyProps) => React.ReactElement

const BODIES: Record<string, BodyComponent> = {
  intro: IntroBody,
  problem: BulletBody,
  solution: BulletBody,
  product: BulletBody,
  market: MarketBody,
  businessModel: BizModelBody,
  traction: TractionBody,
  competition: CompetitionBody,
  gtm: GTMBody,
  financials: FinancialsBody,
  team: TeamBody,
  ask: AskBody,
}

const SLIDE_LABEL: Record<string, string> = {
  intro: 'Introduction', problem: 'The Problem', solution: 'Our Solution',
  product: 'Product', market: 'Market Size', businessModel: 'Business Model',
  traction: 'Traction', competition: 'Competition', gtm: 'Go-to-Market',
  financials: 'Financials', team: 'Team', ask: 'The Ask',
}

// ── SlideCard ──────────────────────────────────────────────────────────────

interface SlideCardProps {
  slide: PitchDeckSlide
  index: number
  branding: BrandingProfile
  isExpanded?: boolean
  companyName?: string
}

export function SlideCard({ slide, index, branding, isExpanded = false, companyName = '' }: SlideCardProps) {
  const [showDetails, setShowDetails] = useState(isExpanded)

  const primary = branding.colors[0] || '#7C3AED'
  const secondary = branding.colors[1] || '#5B21B6'
  const accent = branding.colors[2] || '#0EA5E9'
  const onPrimary = getContrastColor(primary)

  const Body = BODIES[slide.id] ?? BulletBody
  const bodyProps: BodyProps = { slide, primary, secondary, accent, onPrimary, logo: branding.logo, companyName }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: primary }}>
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
          style={{ backgroundColor: `${onPrimary}22`, color: onPrimary }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate" style={{ color: onPrimary }}>{slide.title}</p>
          <p className="text-[9px] opacity-60 truncate" style={{ color: onPrimary }}>{SLIDE_LABEL[slide.id]}</p>
        </div>
      </div>

      {/* Visual slide body */}
      <div className="h-44 overflow-hidden border-b border-gray-50">
        <Body {...bodyProps} />
      </div>

      {/* Design notes toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Eye size={11} />
          {showDetails ? 'Hide notes' : 'Design notes & visual'}
        </span>
        {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {showDetails && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-50">
          <div className="p-2 bg-sky-50 rounded-lg mt-2">
            <p className="text-[9px] font-semibold text-sky-600 mb-0.5">Suggested Visual</p>
            <p className="text-[10px] text-sky-700 leading-snug">{slide.suggestedVisual}</p>
          </div>
          <div className="p-2 rounded-lg space-y-1.5" style={{ backgroundColor: `${primary}08` }}>
            {[
              ['Layout', slide.designNotes.layout],
              ['Colors', slide.designNotes.colorUsage],
              ['Fonts', slide.designNotes.fontHierarchy],
              ['Logo', slide.designNotes.logoPlacement],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{label}: </span>
                <span className="text-[10px] text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SlidePreview (compact thumbnail for overview) ──────────────────────────

export function SlidePreview({
  slide, index, branding, onClick,
}: {
  slide: PitchDeckSlide
  index: number
  branding: BrandingProfile
  onClick: () => void
}) {
  const primary = branding.colors[0] || '#7C3AED'
  const onPrimary = getContrastColor(primary)
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all duration-200"
    >
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: primary }}>
        <span className="text-xs font-bold flex-shrink-0" style={{ color: onPrimary }}>{index + 1}</span>
        <span className="text-xs font-medium truncate" style={{ color: onPrimary }}>{slide.title}</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{slide.bullets[0]}</p>
      </div>
    </button>
  )
}
