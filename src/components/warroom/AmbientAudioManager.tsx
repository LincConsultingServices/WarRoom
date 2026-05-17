'use client'

import { useEffect } from 'react'
import { useAmbientAudio, type AmbientScene } from '@/src/hooks/useAmbientAudio'

interface AmbientAudioManagerProps {
  scene: AmbientScene
}

export function AmbientAudioManager({ scene }: AmbientAudioManagerProps) {
  const { setScene } = useAmbientAudio()

  useEffect(() => {
    setScene(scene)
  }, [scene, setScene])

  useEffect(() => {
    return () => {
      setScene(null)
    }
  }, [setScene])

  return null
}
