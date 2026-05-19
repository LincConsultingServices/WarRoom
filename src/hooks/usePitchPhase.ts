'use client'

import { useRef, useState } from 'react'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type { Investor } from '@/src/types'

// ============================================
// usePitchPhase — manages pitch recording and AI analysis.
// The conversational follow-up loop now lives in the
// Investor Q&A phase; this hook only handles the pitch itself.
// ============================================

export function usePitchPhase(assessmentId: string) {
  const pitchRecorder = useAudioRecorder(60)

  const [pitchText, setPitchText] = useState('')
  const [pitchAnalysis, setPitchAnalysis] = useState<{
    transcription: string; feedback: string; strengths: string[]; weaknesses: string[];
    overallScore: number; clarity: number; confidence: number; persuasion: number;
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleSubmitPitchAudio(_leadInvestor?: Investor) {
    if (!pitchRecorder.audioBlob) { setError('Please record your pitch first'); return }
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    try {
      const result = await api.assessments.submitPitchAudio(assessmentId, pitchRecorder.audioBlob)
      setPitchAnalysis(result.analysis)
      setPitchText(result.analysis.transcription)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze pitch')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  return {
    pitchRecorder,
    pitchText, setPitchText,
    pitchAnalysis, setPitchAnalysis,
    isSubmitting, isAnalyzing,
    error, setError,
    handleSubmitPitchAudio,
    audioRef,
  }
}
