import React from "react"
import { MotionConfig } from 'framer-motion'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cinzel, Cinzel_Decorative, EB_Garamond, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/src/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { NarratorOrb } from '@/src/components/narrator/NarratorOrb'
import { CustomCursor } from '@/src/components/effects/CustomCursor'
import { EmberParticles } from '@/src/components/effects/EmberParticles'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-got',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

// Premium font stack — Iron Throne overhaul
const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  variable: '--font-cinzel-decorative',
  weight: ['400', '700'],
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-body-serif',
  weight: ['400', '500'],
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-data-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: "KK's War Room — Forge Your Legacy",
  description: 'Enter the War Room. Face legendary investors, defend your vision, and forge your entrepreneurial legacy in the ultimate pressure simulation.',
  keywords: ['entrepreneurship', 'simulation', 'pitch', 'investors', 'war room', 'gamified'],
  generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0b09'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cinzelDecorative.variable} ${ebGaramond.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* reducedMotion="user" → every Framer Motion animation respects the
                OS "reduce motion" setting (transforms/layout become instant,
                opacity/colour preserved). Complements the CSS rules in globals.css. */}
            <MotionConfig reducedMotion="user">
              {children}
              <NarratorOrb />
              <CustomCursor />
              <EmberParticles density={30} />
              <Toaster />
            </MotionConfig>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
