const NO_SPEECH_MARKERS = new Set([
  '',
  'silence',
  '[silence]',
  '[no speech detected]',
  'no speech detected',
])

export function isNoSpeechTranscript(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return true
  if (NO_SPEECH_MARKERS.has(normalized)) return true
  return normalized.includes('no speech detected') || normalized.includes('no speech')
}

export function displayTranscript(value: string | null | undefined): string {
  if (isNoSpeechTranscript(value)) return ''
  return (value ?? '').trim()
}