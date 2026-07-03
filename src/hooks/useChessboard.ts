'use client'

import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { useChessboardCore } from './useChessboardCore'
import { usePitchPhase } from './usePitchPhase'
import { useInvestorQA } from './useInvestorQA'
import { useNegotiation, MAX_NEG_ROUNDS } from './useNegotiation'

// ============================================
// useChessboard — composes the three independent phase hooks:
//   useChessboardCore   → phase state, investor loading, dark theme
//   usePitchPhase    → recording, analysis, lead-investor followup
//   useInvestorQA    → per-investor Q&A loop
//   useNegotiation   → offer selection, counter, accept/reject
//
// The chessboard/page.tsx consumes this single hook for convenience,
// but each sub-hook can be used independently if a phase is
// called without completing the full simulation flow.
// ============================================

export type { ChessboardPhase } from './useChessboardCore'

export function useChessboard(assessmentId: string) {
  const router = useRouter()

  const core = useChessboardCore(assessmentId)
  const pitch = usePitchPhase(assessmentId)
  const qa = useInvestorQA(assessmentId)
  const neg = useNegotiation(assessmentId)

  const currentInvestor = core.investors[qa.currentInvestorIndex]

  // ---- Cross-phase wiring ----

  /** Called after pitch is analysed — moves to Q&A (no follow-up loop) */
  function handleContinueFromPitch() {
    pitch.setPitchAnalysis(null)
    qa.setCurrentInvestorIndex(0)
    qa.setResponseSubmitted(false)
    core.setPhase('INVESTOR_QA')
  }

  /** Move to next investor or, when all done, fetch offers and advance to deals */
  async function handleContinueToNextInvestor() {
    const hasMore = qa.advanceToNextInvestor(core.investors)
    if (!hasMore) {
      try {
        const fetchedOffers = await api.assessments.getChessboardOffers(assessmentId)
        neg.setOffers(fetchedOffers)
      } catch (err) {
        console.error('Failed to fetch offers', err)
      }
      core.setPhase('DEAL_RESULTS')
    }
  }

  /** End simulation (walkout) and go to final report */
  async function handleEndSimulation() {
    try { await api.assessments.walkout(assessmentId) } catch { }
    router.push(`/assessment/${assessmentId}/final-report`)
  }

  // Determine the shared error (last non-empty one wins)
  const error = neg.error || qa.error || pitch.error || core.error
  const inQA = core.phase === 'INVESTOR_QA'

  return {
    // Phase
    phase: core.phase,
    investors: core.investors,
    error,

    // Pitch-specific
    pitchRecorder: pitch.pitchRecorder,
    pitchText: pitch.pitchText,
    setPitchText: pitch.setPitchText,
    pitchAnalysis: pitch.pitchAnalysis,
    preparedPitch: core.preparedPitch,

    // Q&A-specific
    currentInvestorIndex: qa.currentInvestorIndex,
    currentInvestor,
    responseSubmitted: qa.responseSubmitted,
    followupActive: qa.followupActive,
    followupQuestion: qa.followupQuestion,

    // Phase-aware shared props
    responseRecorder: qa.responseRecorder,
    responseTranscription: qa.responseTranscription,
    currentInvestorReaction: qa.currentInvestorReaction,
    isSubmitting: inQA ? qa.isSubmitting : pitch.isSubmitting,
    isAnalyzing: inQA ? qa.isAnalyzing : pitch.isAnalyzing,
    isPlayingAudio: qa.isPlayingAudio,

    // Negotiation
    offers: neg.offers,
    selectedOffer: neg.selectedOffer,
    negRound: neg.negRound,
    negHistory: neg.negHistory,
    MAX_NEG_ROUNDS,
    dealFinalized: neg.dealFinalized,
    isNegVoiceSubmitting: neg.isNegVoiceSubmitting,
    acceptedDealTerms: neg.acceptedDealTerms,
    walkedAwayInvestor: neg.walkedAwayInvestor,
    negotiationRecorder: neg.negotiationRecorder,

    // Handlers
    handleSubmitPitchAudio: () => pitch.handleSubmitPitchAudio(core.investors[0]),
    handleContinueFromPitch,
    handleRespondToInvestorAudio: () => qa.handleRespondToInvestorAudio(currentInvestor),
    handleSubmitFollowupResponse: () => qa.handleSubmitFollowupResponse(currentInvestor),
    handleContinueToNextInvestor,
    handleSelectOffer: neg.handleSelectOffer,
    handleNegotiateAudio: neg.handleNegotiateAudio,
    handleAcceptDeal: neg.handleAcceptDeal,
    handleRejectDeal: neg.handleRejectDeal,
    handleEndSimulation,
  }
}
