'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { STAGE_ORDER, STAGE_DURATIONS } from '@/src/lib/constants'
import { useStageTimer } from '@/src/hooks/useStageTimer'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { useMentorLifeline } from '@/src/hooks/useMentorLifeline'
import { usePhaseTransition } from '@/src/hooks/usePhaseTransition'
import type {
  SimQuestion, SimOption, PhaseResponse,
  StageName, Mentor, Leader, Investor,
} from '@/src/types'

// ============================================
// useSimulation — composes sub-hooks into a single
// interface for the simulation page.
//
// Sub-hooks (can be used independently):
//   useMentorLifeline  → mentor overlay + lifeline API
//   usePhaseTransition → scenario display, restart, buyout
//   useStageTimer      → countdown per stage
//   useLeaderboard     → live batch leaderboard via WS
// ============================================

export interface PhaseAnswers { [questionId: string]: PhaseResponse }

export function useSimulation(assessmentId: string) {
  const router = useRouter()

  // ---- Core state ----
  const [state, setState] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<PhaseAnswers>({})
  const [qIndex, setQIndex] = useState(0)
  const [mcqFeedback, setMcqFeedback] = useState<string | null>(null)

  // ---- Dynamic scenario ----
  const [dynamicScenario, setDynamicScenario] = useState<any | null>(null)
  const [loadingScenario, setLoadingScenario] = useState(false)
  const loadingScenarioRef = useRef(false)
  const [dynamicScenarioError, setDynamicScenarioError] = useState('')
  const [scenarioRetryTick, setScenarioRetryTick] = useState(0)
  const [loadingFollowup, setLoadingFollowup] = useState<Record<string, boolean>>({})
  const [followupScenarios, setFollowupScenarios] = useState<Record<string, { question: string }>>({})
  const [followupError, setFollowupError] = useState<Record<string, string>>({})

  // ---- Buyout form state ----
  const [buyoutCompany, setBuyoutCompany] = useState('')
  const [buyoutAmount, setBuyoutAmount] = useState('')

  // ---- Revenue / user ----
  const [revenue, setRevenue] = useState(0)
  const [prevRevenue, setPrevRevenue] = useState<number | undefined>()
  const [userId, setUserId] = useState<string | undefined>()
  const [batchCode, setBatchCode] = useState<string | undefined>()
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, Record<string, number>>>({})

  // ---- Config ----
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  // ---- Character picker ----
  const [showPanelSelection, setShowPanelSelection] = useState(false)
  const [settingCharacters, setSettingCharacters] = useState(false)

  // ---- UI overlays ----
  const [showCapitalAnimation, setShowCapitalAnimation] = useState(false)
  const [showStageNarration, setShowStageNarration] = useState(false)
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [showMentorTip, setShowMentorTip] = useState(false)
  const mentorTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshotContinueRef = useRef<(() => void) | null>(null)
  const autoSubmitTriggered = useRef(false)
  // Stable ref so usePhaseTransition can call load before it is declared
  const loadRef = useRef<() => Promise<void>>(async () => {})

  // ---- Sub-hooks ----
  const mentor = useMentorLifeline(assessmentId)
  const transition = usePhaseTransition(assessmentId, () => loadRef.current())
  const { entries, connected, updatedAt } = useLeaderboard(batchCode)

  // ---- Derived ----
  const simulation = state?.simulation
  const questions: SimQuestion[] = state?.currentStageQuestions || []
  const currentQ = questions[qIndex] as SimQuestion | undefined
  const isCrisisQuestion = !!currentQ && (
    (currentQ as any)?.type === 'scenario' || (currentQ as any)?.type === 'dynamic_scenario' ||
    currentQ?.scenario_step === 'problem' || !!currentQ?.pressure_text
  )
  const shouldRunTimer = simulation?.currentStage
    ? STAGE_ORDER.indexOf(simulation.currentStage as StageName) >= STAGE_ORDER.indexOf('STAGE_1_VALIDATION')
    : false
  const stageDuration = simulation?.currentStage ? (STAGE_DURATIONS[simulation.currentStage] || 10) : 10
  const stageTimer = useStageTimer(
    assessmentId, simulation?.currentStage, stageDuration,
    !transition.submitting && !loading && !transition.showingScenario && !!state && shouldRunTimer
  )

  // ---- Load ----
  async function load() {
    if (!assessmentId) return
    try {
      const data = await api.assessments.get(assessmentId)
      setState(data)
      if ((data as any)?.simulation?.revenueProjection) setRevenue((data as any).simulation.revenueProjection)
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation')
    } finally { setLoading(false) }
  }
  // Keep loadRef in sync
  loadRef.current = load

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    const b = JSON.parse(localStorage.getItem('batch') || '{}')
    setUserId(u?.id); setBatchCode(b?.code)
    setLoadingConfig(true)
    Promise.all([api.config.getMentors(), api.config.getLeaders(), api.config.getInvestors()])
      .then(([m, l, i]) => { setMentors(m); setLeaders(l); setInvestors(i) })
      .catch(() => {}).finally(() => setLoadingConfig(false))
    load()
  }, []) // eslint-disable-line

  // Mentor tip popup
  useEffect(() => {
    if (mentorTipTimerRef.current) clearTimeout(mentorTipTimerRef.current)
    setShowMentorTip(false)
    if (simulation?.currentStage) mentorTipTimerRef.current = setTimeout(() => setShowMentorTip(true), 15000)
    return () => { if (mentorTipTimerRef.current) clearTimeout(mentorTipTimerRef.current) }
  }, [simulation?.currentStage])

  // Reset on stage change
  useEffect(() => {
    setQIndex(0); setAnswers({}); setMcqFeedback(null); transition.setSubmitError('')
    setDynamicScenario(null); setDynamicScenarioError('')
  }, [simulation?.currentStage]) // eslint-disable-line

  // Pre-fetch dynamic scenarios
  useEffect(() => {
    if (simulation?.currentStage && assessmentId) {
      api.assessments.getStageDynamicScenarios(assessmentId, simulation.currentStage).catch(() => {})
    }
  }, [simulation?.currentStage, assessmentId])

  // Redirect to war-room when stage hits STAGE_4
  useEffect(() => {
    if (simulation?.currentStage === 'STAGE_4_WARROOM' && !transition.showingScenario) {
      router.push(`/assessment/${assessmentId}/war-room`)
    }
  }, [simulation?.currentStage, assessmentId, router, transition.showingScenario])

  // Reset dynamic scenario when question changes
  useEffect(() => {
    if ((currentQ as any)?.type === 'dynamic_scenario' || currentQ?.type === 'scenario') {
      setDynamicScenario(null); setMcqFeedback(null); setDynamicScenarioError('')
      loadingScenarioRef.current = false; setLoadingScenario(false)
    }
  }, [currentQ?.q_id]) // eslint-disable-line

  // Fetch dynamic scenario
  useEffect(() => {
    let ignore = false
    const qType = (currentQ as any)?.type
    if (currentQ && qType === 'dynamic_scenario' && simulation && !loadingScenarioRef.current) {
      const run = async () => {
        loadingScenarioRef.current = true; setLoadingScenario(true)
        let ds: any = null; let err: any = null; let attempts = 0
        while (attempts < 3 && !ignore && !ds) {
          try {
            ds = await api.assessments.getDynamicScenario(assessmentId, simulation.currentStage, currentQ.q_id)
            if (ds?.error) throw new Error(ds.error)
          } catch (e) { err = e; attempts++; if (attempts < 3 && !ignore) await new Promise((r) => setTimeout(r, 2000)) }
        }
        if (!ignore) {
          if (err) setDynamicScenarioError(err?.message || 'Failed')
          else if (ds) { ds.questionId = ds.questionId || ds.question_id || currentQ.q_id; setDynamicScenario(ds) }
        }
        loadingScenarioRef.current = false; setLoadingScenario(false)
      }
      run()
    }
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ?.q_id, assessmentId, simulation?.currentStage, scenarioRetryTick])

  // Auto-submit on timer expiry
  useEffect(() => {
    if (stageTimer.expired && !autoSubmitTriggered.current && !transition.submitting && state) {
      autoSubmitTriggered.current = true; doPhaseSubmit()
    }
  }, [stageTimer.expired]) // eslint-disable-line
  useEffect(() => { autoSubmitTriggered.current = false }, [simulation?.currentStage])

  // ---- Handlers ----

  function handleSelectOption(opt: SimOption, questionId?: string) {
    const qId = questionId || currentQ?.q_id; if (!qId) return
    const qType = (currentQ as any)?.type || ''
    const isScenario = qType === 'scenario' || qType === 'dynamic_scenario'
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], questionId: qId, type: (isScenario ? qType : 'multiple_choice') as any, selectedOptionId: opt.id } }))
    if (!questionId) setMcqFeedback(opt.feedback || null)
    if (qId === 'Q_0_1' || qId === 'Q_0_CAPITAL') {
      setState((p: any) => p ? { ...p, simulation: { ...p.simulation, capital: 50000 } } : p)
      setPrevRevenue(revenue); setRevenue(50000)
      setShowCapitalAnimation(true); setTimeout(() => setShowCapitalAnimation(false), 3000)
    }
  }

  async function handleConfirmScenarioDecision(opt: SimOption, questionId?: string) {
    const qId = questionId || currentQ?.q_id; if (!qId) return
    const qType = (currentQ as any)?.type || ''
    if ((qType === 'scenario' || qType === 'dynamic_scenario') && !followupScenarios[qId]) {
      setLoadingFollowup((p) => ({ ...p, [qId]: true })); setFollowupError((p) => ({ ...p, [qId]: '' }))
      try {
        const result = await api.assessments.generateFollowup({
          introduction: simulation?.userIdea || 'Building a business.',
          originalQuestion: (qType === 'dynamic_scenario' && dynamicScenario) ? dynamicScenario.questionText : (currentQ?.text || ''),
          selectedOptionText: opt.text, selectedOptionFeedback: opt.feedback || opt.signal || '',
          roundNumber: questions.findIndex((q: any) => q.q_id === qId) + 1,
        })
        if (result?.question) setFollowupScenarios((p) => ({ ...p, [qId]: { question: result.question } }))
      } catch (e: any) { setFollowupError((p) => ({ ...p, [qId]: e.message || 'Failed' })) }
      finally { setLoadingFollowup((p) => ({ ...p, [qId]: false })) }
    }
  }

  function handleTextChange(text: string, questionId?: string) {
    const qId = questionId || currentQ?.q_id; if (!qId) return
    setAnswers((prev) => {
      const ex = prev[qId] || {}
      return { ...prev, [qId]: { ...ex, questionId: qId, type: ex.type || 'open_text', text } }
    })
  }

  function handleBudgetAllocation(questionId: string, optionId: string, value: number) {
    setBudgetAllocations((prev) => {
      const q = { ...(prev[questionId] || {}), [optionId]: value }
      const updated = { ...prev, [questionId]: q }
      setAnswers((a) => ({ ...a, [questionId]: { questionId, type: 'budget_allocation', allocations: q } }))
      setState((s: any) => {
        if (!s) return s
        const allocs: Record<string, number> = {}
        questions.filter((q) => q.type === 'budget_allocation' && q.options).forEach((q) => {
          const qa = updated[q.q_id]; if (qa) q.options!.forEach((o) => { if ((qa as any)[o.id]) allocs[o.text] = (qa as any)[o.id] })
        })
        return { ...s, simulation: { ...s.simulation, budgetAllocations: allocs } }
      })
      return updated
    })
  }

  function goBack() { if (qIndex > 0) { setQIndex((i) => i - 1); setMcqFeedback(null) } }
  function goNext() { if (qIndex < questions.length - 1) { setQIndex((i) => i + 1); setMcqFeedback(null) } }

  async function doPhaseSubmit() {
    transition.setSubmitting(true); transition.setSubmitError('')
    try {
      const responses: PhaseResponse[] = questions.map((q: SimQuestion) => answers[q.q_id] || { questionId: q.q_id, type: q.type as PhaseResponse['type'], text: '' })
      const aiKey = `AI_${simulation.currentStage}`
      if (answers[aiKey]) responses.push(answers[aiKey])
      const result = await api.assessments.submitPhase(assessmentId, { stageId: simulation.currentStage, responses })
      if (result.revenueProjection) { setPrevRevenue(revenue); setRevenue(result.revenueProjection) }
      if ((result as any).simCompleted) { router.push(`/assessment/${assessmentId}/final-report`); return }
      const proceed = async () => {
        if ((result as any).phaseScenario) { transition.setPhaseScenario((result as any).phaseScenario); transition.setShowingScenario(true) }
        else if (result.nextStage) {
          const nxt = (result.nextStage as any)?.id || result.nextStage
          if (nxt === 'STAGE_4_WARROOM') { router.push(`/assessment/${assessmentId}/war-room`); return }
          await load()
        } else { router.push(`/assessment/${assessmentId}/war-room`) }
      }
      snapshotContinueRef.current = () => { setShowSnapshot(false); proceed() }
      setShowSnapshot(true)
    } catch (err: any) { transition.setSubmitError(err.message || 'Failed to submit phase') }
    finally { transition.setSubmitting(false) }
  }

  async function handleCharacterConfirm(selected: { mentors: string[]; leaders: string[]; investors: string[] }) {
    setSettingCharacters(true)
    try {
      await api.assessments.setCharacters(assessmentId, { selectedMentors: selected.mentors, selectedLeaders: selected.leaders, selectedInvestors: selected.investors })
      setShowPanelSelection(false)
      await load()
    } catch (err: any) { transition.setSubmitError(err.message || 'Failed') }
    finally { setSettingCharacters(false) }
  }

  function acknowledgeInfo(qId: string, type: 'info' | 'ai_scenario' = 'info') {
    setAnswers((prev) => ({ ...prev, [qId]: { questionId: qId, type, text: 'acknowledged' } }))
  }

  function retryScenario() { setDynamicScenarioError(''); setDynamicScenario(null); setScenarioRetryTick((r) => r + 1) }

  // Wrap mentor handler to inject state update for lifelinesLeft
  async function handleUseMentor() {
    const result = await mentor.handleUseMentor(mentors)
    if (result) {
      setState((p: any) => p ? {
        ...p,
        simulation: { ...p.simulation, mentorLifelinesRemaining: result.lifelinesLeft },
        progress: { ...p.progress, mentorLifelinesRemaining: result.lifelinesLeft },
      } : p)
    }
  }

  return {
    // Core
    state, loading, error, simulation, questions, currentQ, qIndex, answers, mcqFeedback,
    dynamicScenario, loadingScenario, dynamicScenarioError, scenarioRetryTick,
    loadingFollowup, followupScenarios, followupError,
    buyoutCompany, buyoutAmount,
    revenue, prevRevenue, userId, batchCode, budgetAllocations,
    mentors, leaders, investors, loadingConfig,
    showPanelSelection, settingCharacters, showCapitalAnimation,
    showStageNarration, showSnapshot, showMentorTip,
    stageTimer, shouldRunTimer, isCrisisQuestion,
    entries, connected, updatedAt, snapshotContinueRef,

    // From sub-hooks (flattened for backwards compat)
    submitting: transition.submitting,
    submitError: transition.submitError,
    phaseScenario: transition.phaseScenario,
    showingScenario: transition.showingScenario,
    showRestartCheckpoint: transition.showRestartCheckpoint,
    showMentorPanel: mentor.showMentorPanel,
    selectedMentorId: mentor.selectedMentorId,
    mentorQuestion: mentor.mentorQuestion,
    mentorLoading: mentor.mentorLoading,
    mentorResult: mentor.mentorResult,

    // Derived
    isIdeationStage: simulation?.currentStage === 'STAGE_NEG2_IDEATION',
    isLastQuestion: qIndex === questions.length - 1,
    isFirstQuestion: qIndex === 0,
    currentAnswer: currentQ ? answers[currentQ.q_id] : undefined,
    answeredCount: Object.keys(answers).length,
    lifelinesLeft: simulation?.mentorLifelinesRemaining ?? 0,

    // Setters (kept for backwards compat with page.tsx)
    setShowPanelSelection, setState, setAnswers, setQIndex, setMcqFeedback,
    setDynamicScenarioError, setDynamicScenario, setScenarioRetryTick,
    setBuyoutCompany, setBuyoutAmount,
    setShowStageNarration,
    setShowMentorPanel: mentor.setShowMentorPanel,
    setSelectedMentorId: mentor.setSelectedMentorId,
    setMentorQuestion: mentor.setMentorQuestion,
    setMentorResult: mentor.setMentorResult,

    // Handlers
    load, goBack, goNext, handleSelectOption, handleConfirmScenarioDecision,
    handleTextChange, handleBudgetAllocation, doPhaseSubmit, handleCharacterConfirm,
    handleRestart: (onClear?: () => void) => transition.handleRestart(onClear || (() => {
      setAnswers({}); setBudgetAllocations({}); setRevenue(0); setPrevRevenue(undefined)
      setQIndex(0); setMcqFeedback(null); setFollowupScenarios({}); setFollowupError({})
      setDynamicScenario(null); setDynamicScenarioError('')
    })),
    handleContinue: transition.handleContinue,
    handleUseMentor,
    closeMentorPanel: mentor.closeMentorPanel,
    handleBuyoutSubmit: () => transition.handleBuyoutSubmit(buyoutCompany, buyoutAmount),
    handleScenarioSubmit: transition.handleScenarioSubmit,
    retryScenario,
    acknowledgeInfo,
  }
}
