'use client'

import { ShieldCheck } from 'lucide-react'
import { SecurityPanel } from '@/src/components/security/SecurityPanel'

// Admin account security. Reachable even when MFA_REQUIRED_ADMIN is on: the
// panel talks only to Firebase, never to the MFA-gated /api/admin routes, so an
// admin without 2FA can always land here and enrol.
export default function AdminSecurityPage() {
  return (
    <div className="py-6 max-w-3xl w-full">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" aria-hidden />
        <h1
          className="text-lg font-semibold tracking-[0.04em] text-[color:var(--color-chessboard-ivory)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Account Security
        </h1>
      </div>
      <p
        className="text-sm text-[color:var(--color-chessboard-smoke)] mb-6"
        style={{ fontFamily: 'var(--font-body, serif)' }}
      >
        Admin accounts can see every cohort and participant. Turn on two-factor authentication.
      </p>
      <SecurityPanel />
    </div>
  )
}
