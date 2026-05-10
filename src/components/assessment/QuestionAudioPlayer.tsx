'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuestionAudioPlayerProps {
  qId: string
  className?: string
}

export function QuestionAudioPlayer({ qId, className }: QuestionAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasAudio, setHasAudio] = useState<boolean | null>(null)

  useEffect(() => {
    const audioSrc = `/audio/questions/${qId}.mp3`
    fetch(audioSrc, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          setHasAudio(true)
        } else {
          setHasAudio(false)
        }
      })
      .catch(() => setHasAudio(false))

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [qId])

  if (!hasAudio) return null

  const toggleAudio = () => {
    const audioSrc = `/audio/questions/${qId}.mp3`
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onerror = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((e) => {
          console.warn('Audio playback failed:', e)
          setIsPlaying(false)
        })
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleAudio()
      }}
      className={cn(
        'flex-shrink-0 h-8 w-8 rounded-full',
        isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground',
        className
      )}
      title="Listen"
    >
      {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  )
}
