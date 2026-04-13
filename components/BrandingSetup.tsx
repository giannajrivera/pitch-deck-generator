'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { HexColorPicker } from 'react-colorful'
import { Upload, X, Plus, Globe, Loader2, Palette, Type, Building2 } from 'lucide-react'
import { cn, fileToBase64 } from '@/lib/utils'
import type { BrandingProfile } from '@/lib/types'

interface BrandingSetupProps {
  branding: BrandingProfile
  onUpdate: (partial: Partial<BrandingProfile>) => void
}

const TONE_OPTIONS = [
  { value: 'bold', label: 'Bold', emoji: '⚡', desc: 'Strong, direct, high-impact' },
  { value: 'formal', label: 'Formal', emoji: '🎩', desc: 'Professional, structured, credible' },
  { value: 'playful', label: 'Playful', emoji: '🎨', desc: 'Friendly, approachable, fun' },
  { value: 'minimal', label: 'Minimal', emoji: '◻️', desc: 'Clean, simple, understated' },
  { value: 'technical', label: 'Technical', emoji: '🔬', desc: 'Data-driven, precise, expert' },
]

const STYLE_OPTIONS = [
  { value: 'startup', label: 'Startup', emoji: '🚀' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢' },
  { value: 'creative', label: 'Creative', emoji: '🎭' },
  { value: 'minimal', label: 'Minimal', emoji: '◾' },
]

const COMPANY_TYPES = ['SaaS', 'Marketplace', 'Consumer App', 'Hardware', 'Biotech', 'Fintech', 'EdTech', 'Services', 'E-commerce', 'Developer Tools', 'AI/ML', 'Other']

const DEFAULT_PALETTE = ['#002d62', '#08193c', '#3075a6', '#1f4a6a', '#ecf4fe', '#d11242']

export function BrandingSetup({ branding, onUpdate }: BrandingSetupProps) {
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null)
  const [websiteLoading, setWebsiteLoading] = useState(false)
  const [websiteError, setWebsiteError] = useState('')
  const [newFont, setNewFont] = useState('')

  // Logo upload
  const onDropLogo = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      const base64 = await fileToBase64(file)
      onUpdate({ logo: base64 })
    },
    [onUpdate]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  // Extract branding from website
  const handleExtractFromUrl = async () => {
    if (!branding.websiteUrl.trim()) return
    setWebsiteLoading(true)
    setWebsiteError('')
    try {
      const res = await fetch('/api/extract-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: branding.websiteUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract branding')
      onUpdate({
        colors: data.colors,
        fonts: data.fonts,
        tone: data.tone,
        style: data.style,
        companyType: data.companyType,
      })
    } catch (err) {
      setWebsiteError(err instanceof Error ? err.message : 'Failed to extract branding')
    } finally {
      setWebsiteLoading(false)
    }
  }

  const addColor = () => {
    if (branding.colors.length < 6) {
      onUpdate({ colors: [...branding.colors, '#002d62'] })
    }
  }

  const removeColor = (index: number) => {
    const newColors = branding.colors.filter((_, i) => i !== index)
    onUpdate({ colors: newColors.length > 0 ? newColors : ['#002d62'] })
    if (activeColorIndex === index) setActiveColorIndex(null)
  }

  const updateColor = (index: number, hex: string) => {
    const newColors = [...branding.colors]
    newColors[index] = hex
    onUpdate({ colors: newColors })
  }

  const addFont = () => {
    if (newFont.trim() && !branding.fonts.includes(newFont.trim())) {
      onUpdate({ fonts: [...branding.fonts, newFont.trim()].slice(0, 3) })
      setNewFont('')
    }
  }

  const removeFont = (index: number) => {
    onUpdate({ fonts: branding.fonts.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Upload size={16} className="text-brand-600" />
          Logo
        </h3>
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
            isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          {branding.logo ? (
            <div className="flex items-center justify-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logo}
                alt="Brand logo"
                className="h-14 object-contain"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ logo: null }) }}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Drop your logo here' : 'Drag & drop your logo, or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 5MB</p>
            </div>
          )}
        </div>
      </section>

      {/* Website URL extraction */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Globe size={16} className="text-brand-600" />
          Website (auto-extract branding)
        </h3>
        <div className="flex gap-2">
          <input
            type="url"
            value={branding.websiteUrl}
            onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
            placeholder="https://yourcompany.com"
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 text-sm transition-all"
            onKeyDown={(e) => { if (e.key === 'Enter') handleExtractFromUrl() }}
          />
          <button
            onClick={handleExtractFromUrl}
            disabled={websiteLoading || !branding.websiteUrl.trim()}
            className={cn(
              'px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
              'bg-brand-600 text-white hover:bg-brand-700',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center gap-2'
            )}
          >
            {websiteLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            {websiteLoading ? 'Extracting...' : 'Extract'}
          </button>
        </div>
        {websiteError && (
          <p className="mt-2 text-xs text-red-500">{websiteError}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          We&apos;ll automatically detect your brand colors, fonts, and tone
        </p>
      </section>

      {/* Color Palette */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Palette size={16} className="text-brand-600" />
          Color Palette
        </h3>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {DEFAULT_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => {
                if (!branding.colors.includes(color)) {
                  onUpdate({ colors: [...branding.colors, color].slice(0, 6) })
                }
              }}
              className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-3">
          {branding.colors.map((color, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <button
                onClick={() => setActiveColorIndex(activeColorIndex === index ? null : index)}
                className={cn(
                  'w-10 h-10 rounded-xl border-2 transition-all hover:scale-105',
                  activeColorIndex === index ? 'border-brand-600 shadow-lg' : 'border-gray-200'
                )}
                style={{ backgroundColor: color }}
                title={`Click to edit ${color}`}
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 font-mono">{color.toUpperCase()}</span>
                <button
                  onClick={() => removeColor(index)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
          {branding.colors.length < 6 && (
            <button
              onClick={addColor}
              className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-brand-400 transition-colors"
              title="Add color"
            >
              <Plus size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {activeColorIndex !== null && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <HexColorPicker
              color={branding.colors[activeColorIndex] || '#002d62'}
              onChange={(hex) => updateColor(activeColorIndex, hex)}
              className="w-full"
            />
            <input
              type="text"
              value={branding.colors[activeColorIndex]}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) updateColor(activeColorIndex, val)
              }}
              className="mt-2 w-full text-center font-mono text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-400"
              placeholder="#002d62"
            />
          </div>
        )}
      </section>

      {/* Fonts */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Type size={16} className="text-brand-600" />
          Fonts
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {branding.fonts.map((font, i) => (
            <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <span style={{ fontFamily: font }}>{font}</span>
              <button onClick={() => removeFont(i)} className="text-gray-400 hover:text-red-400 ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        {branding.fonts.length < 3 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
              placeholder="e.g. Inter, Playfair Display, Montserrat"
              onKeyDown={(e) => { if (e.key === 'Enter') addFont() }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
            />
            <button
              onClick={addFont}
              disabled={!newFont.trim()}
              className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-brand-700"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-400">Enter Google Font names or your brand font names</p>
      </section>

      {/* Tone & Style */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-brand-600" />
          Brand Tone & Style
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Tone of voice</p>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ tone: opt.value })}
                  title={opt.desc}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    branding.tone === opt.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Visual style</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ style: opt.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    branding.style === opt.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Company type</p>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ companyType: type })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    branding.companyType === type
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
