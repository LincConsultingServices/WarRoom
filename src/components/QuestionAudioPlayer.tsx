'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Module-level cache: key → true (exists) | false (missing) | Promise (in-flight)
// Prevents duplicate HEAD requests when multiple component instances mount for the same key
const audioExistsCache = new Map<string, boolean | Promise<boolean>>()

async function probeAudioKeys(keys: string[]): Promise<boolean> {
  const cacheKey = keys.join('|')
  const cached = audioExistsCache.get(cacheKey)
  if (cached instanceof Promise) return cached
  if (typeof cached === 'boolean') return cached

  const promise = (async () => {
    for (const key of keys) {
      try {
        const res = await fetch(`/audio/questions/${key}.mp3`, { method: 'HEAD' })
        if (res.ok) { audioExistsCache.set(cacheKey, true); return true }
      } catch { /* continue */ }
    }
    audioExistsCache.set(cacheKey, false)
    return false
  })()

  audioExistsCache.set(cacheKey, promise)
  return promise
}

interface QuestionAudioPlayerProps {
  audioKey?: string
  audioKeys?: string[]
  className?: string
}

export function QuestionAudioPlayer({ audioKey, audioKeys, className }: QuestionAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasAudio, setHasAudio] = useState<boolean | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const candidateKeys = audioKeys?.length ? audioKeys : audioKey ? [audioKey] : []
  const cacheKey = candidateKeys.join('|')

  useEffect(() => {
    if (candidateKeys.length === 0) { setHasAudio(false); return }
    let cancelled = false

    // Check cache synchronously first to avoid flash
    const cached = audioExistsCache.get(cacheKey)
    if (typeof cached === 'boolean') { setHasAudio(cached); return }

    probeAudioKeys(candidateKeys).then(result => {
      if (!cancelled) setHasAudio(result)
    })

    return () => {
      cancelled = true
      audioRef.current?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  if (!hasAudio) return null

  const resolvedKey = candidateKeys[0]

  const toggleAudio = () => {
    const src = `/audio/questions/${resolvedKey}.mp3`
    if (!audioRef.current || audioRef.current.src !== new URL(src, window.location.origin).href) {
      audioRef.current = new Audio(src)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onerror = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAudio() }}
      className={cn('flex-shrink-0 h-8 w-8 rounded-full', isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground', className)}
      title="Listen"
    >
      {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  )
}
