'use client'

import { useAudioSettings } from '@/src/hooks/useAudioSettings'

/**
 * A headless component mounted at the root level (in app/layout.tsx)
 * that synchronizes the audioStore channels with the backend Settings API.
 */
export function AudioSettingsLoader() {
  useAudioSettings()
  return null
}