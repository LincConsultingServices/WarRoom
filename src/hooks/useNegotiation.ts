'use client'

import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import { useToast } from '@/hooks/use-toast'

// ============================================
// useNegotiation — manages offer selection, counter-offer
// voice rounds, accept/reject, and the confetti celebration.
// Independent from pitch and Q&A phases.
// ============================================

export const MAX_NEG_ROUNDS = 4

export function useNegotiation(assessmentId: string) {
  const negotiationRecorder = useAudioRecorder(15)
  const { toast } = useToast()

  const [offers, setOffers] = useState<any[]>([])
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
  const [negRound, setNegRound] = useState(0)
  const [negHistory, setNegHistory] = useState<{ sender: string; msg: string; type: 'investor' | 'user' }[]>([])
  const [dealFinalized, setDealFinalized] = useState(false)
  const [isNegVoiceSubmitting, setIsNegVoiceSubmitting] = useState(false)
  const [acceptedDealTerms, setAcceptedDealTerms] = useState<{ capital: number; equity: number; investorName: string } | null>(null)
  const [walkedAwayInvestor, setWalkedAwayInvestor] = useState<string | null>(null)
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Reset recorder when offer changes
  useEffect(() => { if (selectedOffer) negotiationRecorder.resetRecording() }, [selectedOffer])

  // Confetti on deal finalized
  useEffect(() => {
    if (!dealFinalized) return
    const end = Date.now() + 3000
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }
    const rnd = (min: number, max: number) => Math.random() * (max - min) + min
    const interval: any = setInterval(() => {
      const left = end - Date.now(); if (left <= 0) return clearInterval(interval)
      const n = 50 * (left / 3000)
      confetti({ ...defaults, particleCount: n, origin: { x: rnd(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount: n, origin: { x: rnd(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
    return () => clearInterval(interval)
  }, [dealFinalized])

  function handleSelectOffer(offer: any) {
    setSelectedOffer(offer)
    setNegRound(0)
    setNegHistory([{ sender: offer.investorName, msg: offer.message, type: 'investor' }])
  }

  async function handleNegotiateAudio() {
    if (!negotiationRecorder.audioBlob || !selectedOffer) return
    const nextRound = negRound + 1
    if (nextRound > MAX_NEG_ROUNDS) { setError('Maximum rounds reached.'); return }
    setIsNegVoiceSubmitting(true); setError('')
    try {
      const result = await api.assessments.counterNegotiateAudio(assessmentId, selectedOffer.investorId, negotiationRecorder.audioBlob)
      const newHistory = [
        ...negHistory,
        { sender: 'You', msg: result.transcription, type: 'user' as const },
        { sender: selectedOffer.investorName, msg: result.message, type: 'investor' as const },
      ]
      setNegHistory(newHistory)
      setNegRound(nextRound)

      if (result.audioBase64) {
        if (audioRef.current) audioRef.current.pause()
        const a = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
        audioRef.current = a
        a.play().catch((playErr) => {
          console.warn('[useNegotiation] audio playback failed', playErr)
          toast({
            variant: 'destructive',
            title: 'Audio playback blocked',
            description: 'The investor response is shown above. Check your browser audio permissions.',
          })
        })
      }

      if (result.accepted) {
        const finalCapital = result.capital || selectedOffer.capital
        const finalEquity = result.equity || selectedOffer.equity
        setAcceptedDealTerms({ capital: finalCapital, equity: finalEquity, investorName: selectedOffer.investorName })
        try { await api.assessments.acceptDeal(assessmentId, selectedOffer.investorId, finalCapital, finalEquity) } catch { }
        setDealFinalized(true)
      } else {
        setSelectedOffer({ ...selectedOffer, capital: result.capital, equity: result.equity })
        if (nextRound >= MAX_NEG_ROUNDS) {
          try {
            await api.assessments.rejectOffer(assessmentId, selectedOffer.offerId || selectedOffer.type)
            setOffers(offers.filter((o) => o.offerId !== selectedOffer.offerId))
            setSelectedOffer(null); setNegRound(0)
          } catch { }
        }
      }
      negotiationRecorder.resetRecording()
    } catch (err: any) {
      const msg = err?.message || 'Failed to negotiate'
      setError(msg)
      toast({
        variant: 'destructive',
        title: 'Negotiator unavailable',
        description: msg,
      })
    } finally {
      setIsNegVoiceSubmitting(false)
    }
  }

  async function handleAcceptDeal(offer: any) {
    try {
      setAcceptedDealTerms({ capital: offer.capital, equity: offer.equity, investorName: offer.investorName })
      await api.assessments.acceptDeal(assessmentId, offer.investorId, offer.capital, offer.equity)
      setDealFinalized(true)
    } catch (e) { console.error(e) }
  }

  async function handleRejectDeal() {
    if (!selectedOffer) return
    const name = selectedOffer.investorName
    try {
      await api.assessments.rejectOffer(assessmentId, selectedOffer.offerId || selectedOffer.type)
      setOffers(offers.filter((o) => o.offerId !== selectedOffer.offerId))
      setSelectedOffer(null); setNegRound(0)
      setWalkedAwayInvestor(name)
      setTimeout(() => setWalkedAwayInvestor(null), 3000)
    } catch (e) { console.error(e) }
  }

  return {
    negotiationRecorder,
    offers, setOffers,
    selectedOffer,
    negRound,
    negHistory,
    dealFinalized,
    isNegVoiceSubmitting,
    acceptedDealTerms,
    walkedAwayInvestor,
    error, setError,
    handleSelectOffer,
    handleNegotiateAudio,
    handleAcceptDeal,
    handleRejectDeal,
  }
}
