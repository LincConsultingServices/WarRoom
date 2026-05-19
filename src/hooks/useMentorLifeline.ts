'use client'

import { useState } from 'react'
import api from '@/src/lib/api'
import type { Mentor, MentorLifelineResult } from '@/src/types'

// ============================================
// useMentorLifeline — isolated mentor panel state and
// lifeline usage logic. Can be composed into any page
// that needs mentor help (simulation, phase transition, etc.)
// ============================================

export function useMentorLifeline(assessmentId: string) {
  const [showMentorPanel, setShowMentorPanel] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [mentorQuestion, setMentorQuestion] = useState('')
  const [mentorLoading, setMentorLoading] = useState(false)
  const [mentorResult, setMentorResult] = useState<MentorLifelineResult | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleUseMentor(_mentors: Mentor[]) {
    if (!selectedMentorId) return
    setMentorLoading(true)
    try {
      const result = await api.assessments.useMentorLifeline(assessmentId, selectedMentorId, mentorQuestion)
      setMentorResult(result)
      return result
    } catch (err: unknown) {
      setMentorResult({ mentorId: selectedMentorId, mentorName: '', guidance: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, lifelinesLeft: 0 })
    } finally {
      setMentorLoading(false)
    }
  }

  function closeMentorPanel() {
    setShowMentorPanel(false)
    setMentorResult(null)
    setMentorQuestion('')
    setSelectedMentorId('')
  }

  function openMentorPanel() {
    setMentorResult(null)
    setShowMentorPanel(true)
  }

  return {
    showMentorPanel, setShowMentorPanel,
    selectedMentorId, setSelectedMentorId,
    mentorQuestion, setMentorQuestion,
    mentorLoading,
    mentorResult, setMentorResult,
    handleUseMentor,
    closeMentorPanel,
    openMentorPanel,
  }
}
