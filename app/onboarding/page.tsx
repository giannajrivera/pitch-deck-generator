'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useStore, useBranding, useMode } from '@/lib/store'
import { BrandingSetup } from '@/components/BrandingSetup'
import { ModeToggle } from '@/components/ModeToggle'

export default function OnboardingPage() {
  const router = useRouter()
  const branding = useBranding()
  const mode = useMode()
  const { setBranding, setMode } = useStore()

  const hasBranding = branding.logo || branding.colors.length > 0 || branding.websiteUrl

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Connect.AI</span>
          </div>
          <ModeToggle mode={mode} onChange={setMode} size="sm" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-brand-600 font-medium mb-2">
            <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Step 1 of 3 — Branding Setup
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Do you have branding materials?
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Your brand shapes how your pitch looks and sounds. Upload your logo, colors, and fonts
            — or enter your website URL to auto-extract your brand style.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            <Sparkles size={13} className="inline mr-1 text-brand-400" />
            Skipping is fine — we&apos;ll apply a clean, modern default design system.
          </p>
        </div>

        {/* Branding form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <BrandingSetup
            branding={branding}
            onUpdate={(partial) => setBranding(partial)}
          />
        </div>

        {/* Preview chip */}
        {hasBranding && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <span className="text-green-600">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-700">Branding saved!</p>
              <p className="text-xs text-green-600">
                {branding.logo && 'Logo • '}
                {branding.colors.length > 0 && `${branding.colors.length} colors • `}
                {branding.fonts.length > 0 && `${branding.fonts.join(', ')} • `}
                {branding.tone && `${branding.tone} tone`}
              </p>
            </div>
            {/* Color swatches */}
            <div className="flex gap-1 ml-auto">
              {branding.colors.slice(0, 5).map((c, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/questionnaire')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip branding setup
          </button>
          <button
            onClick={() => router.push('/questionnaire')}
            className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-200 hover:shadow-lg hover:shadow-brand-300"
          >
            Continue to Questions
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
