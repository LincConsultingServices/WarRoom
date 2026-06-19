'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/**
 * Back control for the Terms page. Returns the user to wherever they came
 * from (e.g. the register page) via the browser history, rather than always
 * navigating to the home route. Falls back to "/" when there is no in-app
 * history to pop (e.g. the page was opened directly via a deep link).
 */
export function TermsBackLink() {
  const router = useRouter()

  const handleBack = () => {
    // history.length > 1 means there is a prior entry to return to.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] transition-colors mb-8"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Go Back
    </button>
  )
}
