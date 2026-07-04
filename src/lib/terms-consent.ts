export const TERMS_CONSENT_STORAGE_KEY = 'chessboardTermsConsentAt'

export function hasAcceptedTerms(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.localStorage.getItem(TERMS_CONSENT_STORAGE_KEY))
}

export function acceptTerms(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TERMS_CONSENT_STORAGE_KEY, new Date().toISOString())
}