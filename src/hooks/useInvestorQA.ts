'use client'

import { useRef, useState } from 'react'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type { Investor, InvestorScorecard } from '@/src/types'

// ============================================
// useInvestorQA — manages the sequential Q&A loop
// across all selected investors.
// Independent from pitch and negotiation phases.
// ============================================

export function useInvestorQA(assessmentId: string) {
  const responseRecorder = useAudioRecorder(15)

  const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
  const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
  const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')
  const [responseTranscription, setResponseTranscription] = useState('')
  const [responseSubmitted, setResponseSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  function playAudioBase64(base64: string) {
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(`data:audio/mp3;base64,${base64}`)
    audioRef.current = audio
    audio.onplay = () => setIsPlayingAudio(true)
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => setIsPlayingAudio(false)
    audio.play().catch(() => setIsPlayingAudio(false))
  }

  async function handleRespondToInvestorAudio(investor: Investor) {
    if (!responseRecorder.audioBlob) { setError('Please record your response'); return }
    if (!investor) return
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    try {
      const result = await api.assessments.respondToInvestorAudio(assessmentId, investor.id, responseRecorder.audioBlob)
      setScorecards((prev) => [...prev, result.scorecard])
      setResponseTranscription(result.transcription)
      setCurrentInvestorReaction(result.scorecard.investorReaction || `${investor.name} has considered your response.`)
      setResponseSubmitted(true)
      responseRecorder.resetRecording()
      if (result.ttsError) setError(`Note: Audio generation failed (${result.ttsError}).`)
      if (result.audioBase64) playAudioBase64(result.audioBase64)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze response')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  /**
   * Move to the next investor, or resolve offers when all investors are done.
   * @returns `true` if more investors remain, `false` if all done (caller should fetch offers + advance phase)
   */
  function advanceToNextInvestor(investors: Investor[]): boolean {
    if (audioRef.current) { audioRef.current.pause(); setIsPlayingAudio(false) }
    setCurrentInvestorReaction('')
    if (currentInvestorIndex < investors.length - 1) {
      setCurrentInvestorIndex((p) => p + 1)
      setResponseSubmitted(false)
      setResponseTranscription('')
      return true
    }
    return false
  }

  return {
    responseRecorder,
    currentInvestorIndex, setCurrentInvestorIndex,
    scorecards,
    currentInvestorReaction, setCurrentInvestorReaction,
    responseTranscription,
    responseSubmitted, setResponseSubmitted,
    isSubmitting, isAnalyzing, isPlayingAudio,
    error, setError,
    audioRef,
    handleRespondToInvestorAudio,
    advanceToNextInvestor,
  }
}
