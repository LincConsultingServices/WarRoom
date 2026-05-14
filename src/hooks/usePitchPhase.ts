'use client'

import { useRef, useState } from 'react'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type { Investor } from '@/src/types'

// ============================================
// usePitchPhase — manages pitch recording, analysis,
// and the lead-investor followup Q&A loop.
// Independent from the Q&A and negotiation phases.
// ============================================

export function usePitchPhase(assessmentId: string) {
  const pitchRecorder = useAudioRecorder(60)
  const responseRecorder = useAudioRecorder(15)

  const [pitchText, setPitchText] = useState('')
  const [pitchAnalysis, setPitchAnalysis] = useState<{
    transcription: string; feedback: string; strengths: string[]; weaknesses: string[];
    overallScore: number; clarity: number; confidence: number; persuasion: number;
  } | null>(null)
  const [followupPhase, setFollowupPhase] = useState<'initial' | 'followup_pending' | 'followup_answered'>('initial')
  const [followupQuestion, setFollowupQuestion] = useState('')
  const [initialTranscription, setInitialTranscription] = useState('')
  const [responseTranscription, setResponseTranscription] = useState('')
  const [feedbackResponseSubmitted, setFeedbackResponseSubmitted] = useState(false)
  const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')

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
    audio.play().catch((e) => { console.error('Auto-play failed:', e); setIsPlayingAudio(false) })
  }

  function resetPitchFollowupState() {
    setFollowupPhase('initial'); setFollowupQuestion(''); setInitialTranscription('')
    setCurrentInvestorReaction(''); setResponseTranscription(''); setFeedbackResponseSubmitted(false)
    responseRecorder.resetRecording()
  }

  async function handleSubmitPitchAudio(leadInvestor: Investor) {
    if (!pitchRecorder.audioBlob) { setError('Please record your pitch first'); return }
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    try {
      const result = await api.assessments.submitPitchAudio(assessmentId, pitchRecorder.audioBlob)
      setPitchAnalysis(result.analysis)
      setPitchText(result.analysis.transcription)
      resetPitchFollowupState()

      if (!leadInvestor) { setInitialTranscription(result.analysis.transcription); setError('No investor available.'); return }

      const followup = await api.assessments.generateInvestorFollowupAudio(assessmentId, leadInvestor.id, pitchRecorder.audioBlob)
      setInitialTranscription(followup.transcription || result.analysis.transcription)
      setFollowupQuestion(followup.followup_question || followup.followupQuestion || 'Can you explain more about the strongest part of your pitch?')
      setFollowupPhase('followup_pending')
      if (followup.audioBase64) playAudioBase64(followup.audioBase64)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze pitch')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  async function handleSubmitPitchFollowupAudio(leadInvestor: Investor) {
    if (!responseRecorder.audioBlob) { setError('Please record your response'); return }
    if (!leadInvestor || !initialTranscription || !followupQuestion) { setError('Context not ready'); return }
    setIsAnalyzing(true); setIsSubmitting(true); setError('')
    try {
      const result = await api.assessments.respondToInvestorFinalAudio(
        assessmentId, leadInvestor.id, initialTranscription, followupQuestion, responseRecorder.audioBlob
      )
      setCurrentInvestorReaction(result.scorecard.investorReaction || `${leadInvestor.name} has considered your answer.`)
      setResponseTranscription(result.transcription)
      setFeedbackResponseSubmitted(true)
      setFollowupPhase('followup_answered')
      responseRecorder.resetRecording()
      if (result.audioBase64) playAudioBase64(result.audioBase64)
    } catch (err: any) {
      setError(err.message || 'Failed to submit response')
    } finally {
      setIsAnalyzing(false); setIsSubmitting(false)
    }
  }

  return {
    pitchRecorder, responseRecorder,
    pitchText, setPitchText,
    pitchAnalysis, setPitchAnalysis,
    followupPhase, followupQuestion,
    responseTranscription, feedbackResponseSubmitted,
    currentInvestorReaction, setCurrentInvestorReaction,
    isSubmitting, isAnalyzing, isPlayingAudio,
    error, setError,
    handleSubmitPitchAudio,
    handleSubmitPitchFollowupAudio,
    resetPitchFollowupState,
    playAudioBase64,
    audioRef,
  }
}
