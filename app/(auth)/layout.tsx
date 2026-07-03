import React from 'react'

/**
 * Auth layout — focused spotlight entry for /login and /register.
 * Clean charcoal canvas with a subtle gold atmospheric glow.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-chessboard-void)] text-[color:var(--color-chessboard-ivory)] relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(200,168,74,0.04) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
