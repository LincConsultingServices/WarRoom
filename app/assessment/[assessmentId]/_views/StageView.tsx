'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuestionAudioPlayer } from '@/src/components/QuestionAudioPlayer'
import { MCQQuestion } from './question-types/MCQQuestion'
import { ScenarioQuestion } from './question-types/ScenarioQuestion'
import { DynamicScenarioQuestion } from './question-types/DynamicScenarioQuestion'
import { BudgetQuestion } from './question-types/BudgetQuestion'
import { AIScenarioQuestion } from './question-types/AIScenarioQuestion'
import { InfoQuestion } from './question-types/InfoQuestion'
import { getQuestionTypeColor, getQuestionTypeIcon, getQuestionTypeLabel } from '@/src/lib/helpers'
import { useFeatureIntro } from '@/src/hooks/useFeatureIntro'
import type { SimQuestion, SimOption, PhaseResponse } from '@/src/types'

interface StageViewProps {
  questions: SimQuestion[]
  qIndex: number
  currentQ: SimQuestion | undefined
  currentAnswer: PhaseResponse | undefined
  answers: Record<string, PhaseResponse | undefined>
  isCrisisQuestion: boolean
  submitting: boolean
  submitError: string
  isLastQuestion: boolean
  isFirstQuestion: boolean
  answeredCount: number
  // dynamic scenario
  dynamicScenario: { questionText: string; options: SimOption[] | string; [key: string]: unknown } | null
  loadingScenario: boolean
  dynamicScenarioError: string
  loadingFollowup: Record<string, boolean>
  followupScenarios: Record<string, { question: string }>
  followupError: Record<string, string>
  mcqFeedback: string | null
  // budget
  capital: number
  budgetAllocations: Record<string, Record<string, number>>
  // buyout
  buyoutCompany: string
  buyoutAmount: string
  // context
  accent: string
  stageNarration?: { month: string; title: string; desc: string }
  // Handlers
  onGoBack: () => void
  onGoNext: () => void
  onSelectOption: (opt: SimOption) => void
  onConfirmScenarioDecision: (opt: SimOption, qId?: string) => void
  onTextChange: (text: string, qId?: string) => void
  onBudgetAllocation: (questionId: string, optionId: string, value: number) => void
  onSubmitPhase: () => void
  onBuyoutCompanyChange: (v: string) => void
  onBuyoutAmountChange: (v: string) => void
  onBuyoutSubmit: () => void
  onRetryScenario: () => void
  onAcknowledge: (qId: string, type?: 'info' | 'ai_scenario') => void
  setQIndex: (i: number) => void
  setMcqFeedback: (v: string | null) => void
}

export function StageView({
  questions, qIndex, currentQ, currentAnswer, answers, isCrisisQuestion,
  submitting, submitError, isLastQuestion, isFirstQuestion,
  dynamicScenario, loadingScenario, dynamicScenarioError,
  loadingFollowup, followupScenarios, followupError, mcqFeedback,
  capital, budgetAllocations, buyoutCompany, buyoutAmount, accent,
  onGoBack, onGoNext, onSelectOption, onConfirmScenarioDecision, onTextChange,
  onBudgetAllocation, onSubmitPhase, onBuyoutCompanyChange, onBuyoutAmountChange,
  onBuyoutSubmit, onRetryScenario, onAcknowledge, setQIndex, setMcqFeedback,
}: StageViewProps) {
  const submitIntro = useFeatureIntro('stage-submit')
  const qType: string = ((currentQ as unknown as Record<string, unknown>)?.type as string) || ''

  function renderQuestionContent() {
    if (!currentQ) return <div className="text-muted-foreground text-sm">No questions available</div>
    if (qType === 'dynamic_scenario') {
      const qId = currentQ.q_id
      return (
        <DynamicScenarioQuestion
          questionId={qId}
          loadingScenario={loadingScenario}
          dynamicScenario={dynamicScenario}
          dynamicScenarioError={dynamicScenarioError}
          selectedOptionId={currentAnswer?.selectedOptionId}
          loadingFollowup={loadingFollowup[qId]}
          followupScenario={followupScenarios[qId]}
          followupError={followupError[qId]}
          followupText={currentAnswer?.text}
          onSelect={(opt: SimOption) => onSelectOption(opt)}
          onConfirmDecision={(opt: SimOption) => onConfirmScenarioDecision(opt, qId)}
          onTextChange={onTextChange}
          onRetryScenario={onRetryScenario}
          onRetryFollowup={(opt: SimOption) => onConfirmScenarioDecision(opt, qId)}
        />
      )
    }
    if (qType === 'scenario' && currentQ.options) {
      const qId = currentQ.q_id
      return (
        <ScenarioQuestion
          options={currentQ.options}
          selectedOptionId={currentAnswer?.selectedOptionId}
          mcqFeedback={mcqFeedback}
          loadingFollowup={loadingFollowup[qId]}
          followupScenario={followupScenarios[qId]}
          followupError={followupError[qId]}
          followupText={currentAnswer?.text}
          onSelect={(opt: SimOption) => onSelectOption(opt)}
          onConfirmDecision={(opt: SimOption) => onConfirmScenarioDecision(opt, qId)}
          onTextChange={onTextChange}
          onRetryFollowup={(opt: SimOption) => onConfirmScenarioDecision(opt, qId)}
        />
      )
    }
    if (qType === 'multiple_choice' && currentQ.options) {
      return <MCQQuestion options={currentQ.options} selectedOptionId={currentAnswer?.selectedOptionId} mcqFeedback={mcqFeedback} onSelect={(opt: SimOption) => onSelectOption(opt)} />
    }
    if (qType === 'budget_allocation' && currentQ.options) {
      return <BudgetQuestion options={currentQ.options} capital={capital} allocations={budgetAllocations[currentQ.q_id] || {}} onAllocate={(optId: string, val: number) => onBudgetAllocation(currentQ.q_id, optId, val)} />
    }
    if (qType === 'ai_scenario') {
      return (
        <AIScenarioQuestion
          questionId={currentQ.q_id}
          text={currentQ.text}
          scenarioStep={currentQ.scenario_step}
          scenarioGroup={currentQ.scenario_group}
          contextText={currentQ.context_text}
          currentAnswer={currentAnswer}
          buyoutCompany={buyoutCompany}
          buyoutAmount={buyoutAmount}
          submitting={submitting}
          onTextChange={onTextChange}
          onBuyoutCompanyChange={onBuyoutCompanyChange}
          onBuyoutAmountChange={onBuyoutAmountChange}
          onBuyoutSubmit={onBuyoutSubmit}
          onAcknowledge={() => onAcknowledge(currentQ.q_id, 'ai_scenario')}
        />
      )
    }
    if (qType === 'info') {
      return <InfoQuestion contextText={currentQ.context_text} isAcknowledged={!!currentAnswer} onAcknowledge={() => onAcknowledge(currentQ.q_id)} />
    }
    // open_text fallback
    return (
      <Textarea
        placeholder="Type your response here..."
        value={currentAnswer?.text || ''}
        onChange={e => onTextChange(e.target.value)}
        rows={6}
        className="resize-none"
      />
    )
  }

  return (
    <div className="flex-1 grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full px-4 py-6">
      <AnimatePresence mode="wait">
        {currentQ ? (
          <motion.div
            key={currentQ.q_id}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className={cn('flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden', isCrisisQuestion && 'border-red-500/50 shadow-red-500/20 crisis-shake')}
          >
            {isCrisisQuestion && <div className="pointer-events-none absolute -inset-2 z-0 rounded-3xl border-2 border-red-500/40 bg-red-500/5 crisis-card" />}

            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: `${getQuestionTypeColor(qType)}60`, color: getQuestionTypeColor(qType) }}>
                  {getQuestionTypeIcon(qType)}{getQuestionTypeLabel(qType)}
                </Badge>
                {currentQ.assess && currentQ.assess.length > 0 && <Badge variant="secondary" className="text-xs">{currentQ.assess.join(', ')}</Badge>}
                {currentAnswer && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold leading-snug">{currentQ.text}</h2>
                {currentQ.scenario_group !== 'investor_panel' && <QuestionAudioPlayer audioKey={currentQ.q_id} />}
              </div>
              {currentQ.context_text && qType !== 'ai_scenario' && qType !== 'info' && (
                <p className="text-sm text-muted-foreground mt-2">{currentQ.context_text}</p>
              )}
            </div>

            <div className="px-6 py-4 flex-1">{renderQuestionContent()}</div>

            <div className="px-6 py-4 border-t flex items-center justify-between gap-4">
              <Button variant="outline" onClick={onGoBack} disabled={isFirstQuestion} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />Back
              </Button>
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => { setQIndex(i); setMcqFeedback(null) }}
                    className={cn('h-2 w-2 rounded-full transition-all', i === qIndex ? 'bg-primary scale-125' : answers[questions[i].q_id] ? 'bg-primary/40' : 'bg-muted-foreground/20')}
                  />
                ))}
              </div>
              {isLastQuestion ? (
                <Button {...submitIntro} onClick={onSubmitPhase} disabled={submitting} size="sm" style={{ backgroundColor: accent }}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Evaluating...</> : <><Send className="h-4 w-4 mr-2" />Submit Phase</>}
                </Button>
              ) : (
                <Button onClick={onGoNext} size="sm">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              )}
            </div>
            {submitError && <div className="px-6 pb-4"><p className="text-sm text-red-500">{submitError}</p></div>}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64 text-muted-foreground">No questions available</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
