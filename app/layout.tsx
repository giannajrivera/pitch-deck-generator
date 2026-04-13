import type { Metadata } from 'next'
import './globals.css'
import { AuthInit } from '@/components/AuthInit'

export const metadata: Metadata = {
  title: 'PitchDeck Generator — From Idea to Investor-Ready in 30 Minutes',
  description:
    'AI-powered pitch deck and talk track generator. Answer guided questions, get a branded 12-slide deck plus 3-5 minute script. Built for founders, students, and workshop participants.',
  keywords: ['pitch deck', 'startup', 'investor', 'AI', 'presentation', 'SBDC', 'accelerator'],
  openGraph: {
    title: 'PitchDeck Generator',
    description: 'From idea to investor-ready pitch in 30 minutes',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <AuthInit />
        {children}
        <div className="w-full text-center py-2 text-xs text-gray-400 border-t border-gray-100 bg-white">
          Powered by <span className="font-semibold text-gray-500">Connect.AI</span>
        </div>
      </body>
    </html>
  )
}
