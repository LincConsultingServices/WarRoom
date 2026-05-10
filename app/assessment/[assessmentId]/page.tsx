'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/src/lib/api'
import { RevenueSidePanel } from '@/src/components/RevenueSidePanel'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { PhaseTransitionScenario } from '@/src/components/PhaseTransitionScenario'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { FadeInUp, CinemaOverlay, StageNarrationOverlay, SnapshotDashboard, MentorTipPopup } from '@/src/components/AnimatedComponents'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CharacterPicker } from '@/src/components/CharacterPicker'
import { QuestionAudioPlayer } from '@/src/components/assessment/QuestionAudioPlayer'
import { SimulationHeader } from '@/src/components/assessment/SimulationHeader'
import { MentorLifelineOverlay } from '@/src/components/assessment/MentorLifelineOverlay'
import { MentorLifelineCard } from '@/src/components/assessment/MentorLifelineCard'
import { SimulationControls } from "@/src/components/assessment/SimulationControls"
import { MultipleChoiceQuestion } from '@/src/components/assessment/MultipleChoiceQuestion'
import { OpenTextQuestion } from '@/src/components/assessment/OpenTextQuestion'
import { BudgetAllocationQuestion } from '@/src/components/assessment/BudgetAllocationQuestion'
import { ScenarioQuestion } from '@/src/components/assessment/ScenarioQuestion'
import { AIConceptQuestion } from '@/src/components/assessment/AIConceptQuestion'
import { useAssessmentStore } from '@/src/stores/assessment-store'
import type {
  SimQuestion,
  StageName,
  Mentor,
  Leader,
  Investor,
  MentorLifelineResult,
} from '@/src/types'

// ---- Helpers ----

function stageLabel(s: string) {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const STAGE_THEMES: Record<string, string> = {
  STAGE_NEG2_IDEATION: '#6366f1',
  STAGE_NEG1_VISION: '#8b5cf6',
  STAGE_0_COMMITMENT: '#f59e0b',
  STAGE_1_VALIDATION: '#10b981',
  STAGE_2A_GROWTH: '#3b82f6',
  STAGE_2B_EXPANSION: '#06b6d4',
  STAGE_3_SCALE: '#a855f7',
  STAGE_WARROOM_PREP: '#ef4444',
  STAGE_4_WARROOM: '#dc2626',
}

const STAGE_NARRATIVES: Record<string, { month: string, title: string, desc: string }> = {
  STAGE_NEG2_IDEATION: { month: 'Month 0', title: 'Ideation', desc: 'Every great company starts with an idea. Define your vision, target market, and initial model.' },
  STAGE_NEG1_VISION: { month: 'Month 1', title: 'Vision & Alignment', desc: 'Align your goals. Decide what kind of company you want to build before taking the leap.' },
  STAGE_0_COMMITMENT: { month: 'Month 2', title: 'The Commitment', desc: 'It is time to decide if you are all-in. Are you ready to commit your time and capital?' },
  STAGE_1_VALIDATION: { month: 'Month 3', title: 'Market Validation', desc: 'Get out of the building. Talk to customers and prove they actually want what you are building.' },
  STAGE_2A_GROWTH: { month: 'Month 6', title: 'Initial Growth', desc: 'You have a product. Now you need to find your first true believers and early adopters.' },
  STAGE_2B_EXPANSION: { month: 'Month 9', title: 'Expansion & Churn', desc: 'Growth brings problems. Deal with scaling issues, team dynamics, and keeping customers happy.' },
  STAGE_3_SCALE: { month: 'Month 12', title: 'Scaling Up', desc: 'You have hit early product-market fit. Now it is time to pour fuel on the fire and scale operations.' },
  STAGE_WARROOM_PREP: { month: 'Month 15', title: 'Pitch Prep', desc: 'You need outside capital to truly win the market. Perfect your pitch before facing the Sharks.' },
  STAGE_4_WARROOM: { month: 'Month 18', title: 'The War Room', desc: 'Face the investors. Defend your valuation, handle tough questions, and secure the bag.' },
}

const STAGE_MENTOR_TIPS: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'Be specific about your target customer. Investors want to see you understand WHO you are building for.',
  STAGE_NEG1_VISION: 'Choose your advisory board wisely — they will shape your strategic decisions throughout the simulation.',
  STAGE_0_COMMITMENT: 'This is your "point of no return" moment. Consider both the personal and financial cost of commitment.',
  STAGE_1_VALIDATION: 'Think about both short-term survival AND long-term growth. Every decision has trade-offs.',
  STAGE_2A_GROWTH: 'Focus on unit economics. Rapid growth without a sustainable model is a recipe for failure.',
  STAGE_2B_EXPANSION: 'Culture issues at this stage can kill startups. Pay attention to team dynamics.',
  STAGE_3_SCALE: 'Scaling too fast is just as dangerous as scaling too slowly. Find the right cadence.',
  STAGE_WARROOM_PREP: 'Know your numbers cold. Investors will push back on claims you cannot back up with data.',
  STAGE_4_WARROOM: 'Confidence is key but know when to listen. The best deals come from collaborative negotiation.',
}

const NARRATION_STAGE_LABELS = ['Idea', 'Vision', 'Commit', 'Validate', 'Grow', 'Expand', 'Scale', 'Prep', 'War Room']

const STAGE_ORDER: StageName[] = [
  'STAGE_NEG2_IDEATION',
  'STAGE_NEG1_VISION',
  'STAGE_0_COMMITMENT',
  'STAGE_1_VALIDATION',
  'STAGE_2A_GROWTH',
  'STAGE_2B_EXPANSION',
  'STAGE_3_SCALE',
  'STAGE_WARROOM_PREP',
  'STAGE_4_WARROOM',
]

const STAGE_DURATIONS: Record<string, number> = {
  STAGE_NEG2_IDEATION: 10,
  STAGE_NEG1_VISION: 5,
  STAGE_0_COMMITMENT: 10,
  STAGE_1_VALIDATION: 10,
  STAGE_2A_GROWTH: 10,
  STAGE_2B_EXPANSION: 10,
  STAGE_3_SCALE: 10,
  STAGE_WARROOM_PREP: 10,
  STAGE_4_WARROOM: 15,
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'scenario': return 'Scenario Based'
    case 'budget_allocation': return 'Budget Allocation'
    case 'open_text': return 'Open Response'
    case 'ai_scenario': return 'AI Scenario'
    case 'info': return 'Information'
    default: return 'Question'
  }
}

function getStageTimerKey(assessmentId: string | undefined, stageId: string): string {
  return `timer_${assessmentId || 'unknown'}_${stageId}`
}

export default function SimulationPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const {
    loading,
    error,
    state,
    answers,
    qIndex,
    submitting,
    submitError,
    phaseScenario,
    showingScenario,
    revenue,
    prevRevenue,
    userId,
    batchCode,
    mentors,
    leaders,
    investors,
    loadingConfig,
    showMentorPanel,
    selectedMentorId,
    mentorQuestion,
    mentorLoading,
    mentorResult,
    showPanelSelection,
    showRestartCheckpoint,
    settingCharacters,
    showCapitalAnimation,
    showStageNarration,
    showSnapshot,
    showMentorTip,
    loadingFollowup,
    followupScenarios,
    followupError,
    
    setAssessmentId,
    setLoading,
    setError,
    setState,
    setAnswers,
    setQIndex,
    setSubmitting,
    setSubmitError,
    setPhaseScenario,
    setShowingScenario,
    setRevenue,
    setPrevRevenue,
    setUserId,
    setBatchCode,
    setMentors,
    setLeaders,
    setInvestors,
    setLoadingConfig,
    setShowMentorPanel,
    setSelectedMentorId,
    setMentorQuestion,
    setMentorLoading,
    setMentorResult,
    setShowPanelSelection,
    setShowRestartCheckpoint,
    setSettingCharacters,
    setShowStageNarration,
    setShowSnapshot,
    setShowMentorTip,
  } = useAssessmentStore()

  useEffect(() => {
    setAssessmentId(assessmentId)
  }, [assessmentId, setAssessmentId])

  const prevStageRef = useRef<string | null>(null)
  const snapshotContinueRef = useRef<(() => void) | null>(null)
  const mentorTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const simulation = state?.assessment
  const currentStageQuestions = state?.currentStageQuestions
  const questions: SimQuestion[] = currentStageQuestions || []
  const currentQ = questions[qIndex] as SimQuestion | undefined

  const isCrisisQuestion = !!currentQ && (currentQ.type === 'scenario' || (currentQ.type as any) === 'dynamic_scenario' || (currentQ as any).scenario_step === 'problem' || !!(currentQ as any).pressure_text)

  const { entries, connected, updatedAt } = useLeaderboard(batchCode)

  const shouldRunTimer = simulation?.currentStage ? STAGE_ORDER.indexOf(simulation.currentStage as StageName) >= STAGE_ORDER.indexOf('STAGE_1_VALIDATION') : false
  const stageDuration = simulation?.currentStage ? (STAGE_DURATIONS[simulation.currentStage] || 10) : 10

  const [timerRemaining, setTimerRemaining] = useState(stageDuration * 60)
  const [timerExpired, setTimerExpired] = useState(false)
  const [timerIsWarning, setTimerIsWarning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!simulation?.currentStage || !shouldRunTimer) return

    const storageKey = getStageTimerKey(assessmentId, simulation.currentStage)
    let startTime = parseInt(localStorage.getItem(storageKey) || '0', 10)
    if (!startTime) {
      startTime = Date.now()
      localStorage.setItem(storageKey, startTime.toString())
    }

    const durationMs = stageDuration * 60 * 1000

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const rem = Math.max(0, durationMs - elapsed)
      const seconds = Math.ceil(rem / 1000)
      setTimerRemaining(seconds)
      setTimerIsWarning(seconds < 60 && seconds > 0)
      if (rem <= 0) {
        setTimerExpired(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [assessmentId, simulation?.currentStage, stageDuration, shouldRunTimer])

  const timerDisplay = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}`

  const load = useCallback(async () => {
    if (!assessmentId) return
    setLoading(true)
    try {
      const data = await api.assessments.get(assessmentId)
      setState(data)
      if ((data.assessment as any).revenueProjection) {
        setRevenue((data.assessment as any).revenueProjection)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, setLoading, setState, setRevenue, setError])

  const handleSubmitPhase = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const responses: any[] = questions.map((q) => {
        const a = answers[q.q_id]
        return a || { questionId: q.q_id, type: q.type, text: '' }
      })
      const aiKey = `AI_${simulation?.currentStage}`
      if (answers[aiKey]) responses.push(answers[aiKey])

      const result = await api.assessments.submitPhase(assessmentId, {
        stageId: simulation?.currentStage || '',
        responses,
      })
      if (result.revenueProjection) {
        setPrevRevenue(revenue)
        setRevenue(result.revenueProjection)
      }

      if (simulation?.currentStage) {
        localStorage.removeItem(getStageTimerKey(assessmentId, simulation.currentStage))
      }

      if (result.stageCompleted && result.nextStage === undefined) {
         router.push(`/assessment/${assessmentId}/final-report`)
         return
      }

      const proceedAfterSnapshot = async () => {
        if (result.phaseScenario) {
          setPhaseScenario(result.phaseScenario)
          setShowingScenario(true)
        } else if (result.nextStage) {
          if (result.nextStage === 'STAGE_4_WARROOM') {
            router.push(`/assessment/${assessmentId}/war-room`)
            return
          }
          await load()
        }
      }

      snapshotContinueRef.current = () => {
        setShowSnapshot(false)
        proceedAfterSnapshot()
      }
      setShowSnapshot(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit phase')
    } finally {
      setSubmitting(false)
    }
  }, [questions, answers, simulation?.currentStage, assessmentId, revenue, router, setPrevRevenue, setRevenue, setPhaseScenario, setShowingScenario, setShowSnapshot, load])

  useEffect(() => {
    if (timerExpired && !submitting && state) {
      handleSubmitPhase()
    }
  }, [timerExpired, submitting, state, handleSubmitPhase])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || '{}')
    setUserId(storedUser?.id)
    setBatchCode(storedBatch?.code)
    
    setLoadingConfig(true)
    Promise.all([
      api.config.getMentors(),
      api.config.getLeaders(),
      api.config.getInvestors(),
    ])
      .then(([m, l, i]) => {
        setMentors(m)
        setLeaders(l)
        setInvestors(i)
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))

    load()
  }, [load, setUserId, setBatchCode, setLoadingConfig, setMentors, setLeaders, setInvestors])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-destructive">{error}</p><Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button></div>
  if (!state || !simulation) return null

  const accent = STAGE_THEMES[simulation.currentStage] || '#6366f1'
  const currentAnswer = currentQ ? answers[currentQ.q_id] : undefined
  const answeredCount = Object.keys(answers).length
  const isIdeationStage = simulation.currentStage === 'STAGE_NEG2_IDEATION'

  const closeMentorPanel = () => {
    setShowMentorPanel(false)
    setMentorResult(null)
    setMentorQuestion('')
    setSelectedMentorId('')
  }

  const handleUseMentor = async () => {
    if (!selectedMentorId) return
    setMentorLoading(true)
    try {
      const result = await api.assessments.useMentorLifeline(assessmentId, selectedMentorId, mentorQuestion)
      setMentorResult(result)
      // Note: In real app, update store or re-fetch state
    } catch (err: any) {
      setMentorResult({ mentorId: selectedMentorId, mentorName: '', guidance: `Error: ${err.message}`, lifelinesLeft: 0 })
    } finally {
      setMentorLoading(false)
    }
  }

  if (showPanelSelection) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Assemble Your Board</h1>
            <p className="text-muted-foreground">Select the mentors, leaders, and investors who will guide your journey.</p>
          </div>
          <CharacterPicker
            mentors={mentors}
            leaders={leaders}
            investors={investors}
            onConfirm={async (selected) => {
              setSettingCharacters(true)
              try {
                await api.assessments.setCharacters(assessmentId, {
                  selectedMentors: selected.mentors,
                  selectedLeaders: selected.leaders,
                  selectedInvestors: selected.investors,
                })
                setShowPanelSelection(false)
                await load()
              } catch (err: any) {
                setSubmitError(err.message || 'Failed to set characters')
              } finally {
                setSettingCharacters(false)
              }
            }}
            loading={settingCharacters}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <MentorLifelineOverlay
        show={showMentorPanel}
        lifelinesLeft={simulation.mentorLifelinesRemaining}
        onClose={closeMentorPanel}
        mentorResult={mentorResult}
        loadingConfig={loadingConfig}
        availableMentors={mentors}
        selectedMentorId={selectedMentorId}
        setSelectedMentorId={setSelectedMentorId}
        mentorQuestion={mentorQuestion}
        setMentorQuestion={setMentorQuestion}
        mentorLoading={mentorLoading}
        onUseMentor={handleUseMentor}
      />
      
      {STAGE_NARRATIVES[simulation.currentStage] && (
        <StageNarrationOverlay
          show={showStageNarration}
          data={STAGE_NARRATIVES[simulation.currentStage]}
          stageIndex={STAGE_ORDER.indexOf(simulation.currentStage as StageName)}
          totalStages={STAGE_ORDER.length}
          stageLabels={NARRATION_STAGE_LABELS}
          accentColor={accent}
          onDismiss={() => setShowStageNarration(false)}
        />
      )}

      <SnapshotDashboard
        show={showSnapshot && !showStageNarration}
        revenue={revenue}
        previousRevenue={prevRevenue}
        leaderboardEntries={entries.map(e => ({ name: e.name || e.userId, score: e.revenueProjection || 0, isUser: e.userId === userId }))}
        stageName={stageLabel(simulation.currentStage)}
        onContinue={() => snapshotContinueRef.current?.()}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <SimulationHeader
          accent={accent}
          stageLabel={stageLabel(simulation.currentStage)}
          currentQuestionIndex={isIdeationStage ? undefined : qIndex}
          totalQuestions={questions.length}
          answeredCount={isIdeationStage ? answeredCount : undefined}
          progressValue={isIdeationStage ? Math.round((answeredCount / questions.length) * 100) : Math.round(((qIndex + 1) / questions.length) * 100)}
          isCrisisQuestion={isCrisisQuestion}
          showTimer={shouldRunTimer}
          timerDisplay={timerDisplay}
          isTimerWarning={timerIsWarning}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
          <div className="hidden lg:flex flex-col gap-4">
            <RevenueSidePanel 
              revenue={revenue} 
              previousRevenue={prevRevenue} 
              currentStage={simulation.currentStage} 
              capital={simulation.capital} 
              budgetAllocations={simulation.budgetAllocations}
            />
          </div>

          <div className="flex flex-col gap-4 min-w-0 relative">
             {/* Question area */}
             <AnimatePresence mode="wait">
                {currentQ && (
                  <motion.div
                    key={currentQ.q_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card rounded-2xl border p-6 space-y-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Badge variant="outline" style={{ color: accent, borderColor: `${accent}40` }}>
                          {getQuestionTypeLabel(currentQ.type)}
                        </Badge>
                        <h2 className="text-xl font-bold">{currentQ.text}</h2>
                      </div>
                      <QuestionAudioPlayer qId={currentQ.q_id} />
                    </div>

                    <div className="py-4">
                      {currentQ.type === 'multiple_choice' && (
                        <MultipleChoiceQuestion
                          options={currentQ.options || []}
                          selectedOptionId={currentAnswer?.selectedOptionId}
                          onSelect={(opt) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: { questionId: currentQ.q_id, type: 'multiple_choice', text: opt.text, selectedOptionId: opt.id }
                          })}
                          mcqFeedback={undefined}
                        />
                      )}
                      
                      {currentQ.type === 'open_text' && (
                        <OpenTextQuestion
                          value={currentAnswer?.text || ''}
                          onChange={(val) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: { questionId: currentQ.q_id, type: 'open_text', text: val }
                          })}
                          placeholder="Type your response here..."
                        />
                      )}

                      {currentQ.type === 'budget_allocation' && (
                        <BudgetAllocationQuestion
                          options={currentQ.options || []}
                          capital={currentQ.total_budget || simulation.capital || 100000}
                          allocations={currentAnswer?.allocations || {}}
                          onChange={(optionId, value) => {
                            const nextAllocations = {
                              ...(currentAnswer?.allocations || {}),
                              [optionId]: value,
                            }
                            setAnswers({
                              ...answers,
                              [currentQ.q_id]: {
                                questionId: currentQ.q_id,
                                type: 'budget_allocation',
                                text: 'Budget Allocated',
                                allocations: nextAllocations,
                              },
                            })
                          }}
                        />
                      )}

                      {(currentQ.type === 'scenario' || (currentQ.type as any) === 'dynamic_scenario') && (
                        <ScenarioQuestion
                          questionText={currentQ.text}
                          options={currentQ.options || []}
                          currentAnswerSelectedOptionId={currentAnswer?.selectedOptionId}
                          currentAnswerText={currentAnswer?.text || ''}
                          followupScenarios={followupScenarios}
                          followupError={followupError}
                          loadingFollowup={loadingFollowup}
                          onSelectOption={(opt) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: { questionId: currentQ.q_id, type: 'scenario', text: opt.text, selectedOptionId: opt.id }
                          })}
                          onConfirmDecision={(opt) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: { questionId: currentQ.q_id, type: 'scenario', text: opt.text, selectedOptionId: opt.id }
                          })}
                          onTextChange={(text) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: {
                              questionId: currentQ.q_id,
                              type: 'scenario',
                              text,
                              selectedOptionId: currentAnswer?.selectedOptionId,
                            },
                          })}
                          onRetryFollowup={() => {}}
                          mcqFeedback={null}
                        />
                      )}

                      {currentQ.type === 'ai_scenario' && (
                        <AIConceptQuestion
                          currentQ={currentQ}
                          currentAnswerText={currentAnswer?.text || ''}
                          onTextChange={(text) => setAnswers({
                            ...answers,
                            [currentQ.q_id]: { 
                              questionId: currentQ.q_id, 
                              type: 'ai_scenario', 
                              text,
                              aiConceptIdea: text,
                            }
                          })}
                          onAcknowledge={() => setAnswers({
                            ...answers,
                            [currentQ.q_id]: {
                              questionId: currentQ.q_id,
                              type: 'ai_scenario',
                              text: currentAnswer?.text || 'Acknowledged',
                            },
                          })}
                        />
                      )}
                    </div>

                    <SimulationControls
                      questions={questions}
                      qIndex={qIndex}
                      isFirstQuestion={qIndex === 0}
                      isLastQuestion={qIndex === questions.length - 1}
                      goBack={() => setQIndex(Math.max(0, qIndex - 1))}
                      goNext={() => setQIndex(Math.min(questions.length - 1, qIndex + 1))}
                      handleSubmitPhase={handleSubmitPhase}
                      submitting={submitting}
                      accent={accent}
                      submitError={submitError || ''}
                      currentAnswer={currentAnswer}
                    />
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="hidden lg:flex flex-col gap-4">
            <MentorLifelineCard
              lifelinesLeft={simulation.mentorLifelinesRemaining}
              onAskMentor={() => setShowMentorPanel(true)}
            />
            <LeaderboardPanel
              entries={entries}
              currentUserId={userId}
              connected={connected}
              updatedAt={updatedAt}
            />
          </div>
        </div>
      </div>
    </>
  )
}
