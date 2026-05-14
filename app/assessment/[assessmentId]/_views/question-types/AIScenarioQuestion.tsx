'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, TrendingUp, ShieldAlert, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SCENARIO_STEP_STYLES } from '@/src/lib/constants'
import { parseInvestorPanelQuestions } from '@/src/lib/helpers'
import { QuestionAudioPlayer } from '@/src/components/QuestionAudioPlayer'

interface AIScenarioQuestionProps {
  scenarioStep?: string
  scenarioGroup?: string
  contextText?: string
  questionId: string
  text: string
  currentAnswer?: any
  buyoutCompany: string
  buyoutAmount: string
  submitError?: string
  submitting?: boolean
  onTextChange: (text: string) => void
  onBuyoutCompanyChange: (v: string) => void
  onBuyoutAmountChange: (v: string) => void
  onBuyoutSubmit: () => void
  onAcknowledge: () => void
}

export function AIScenarioQuestion({
  scenarioStep, scenarioGroup, contextText, questionId, text,
  currentAnswer, buyoutCompany, buyoutAmount, submitError, submitting,
  onTextChange, onBuyoutCompanyChange, onBuyoutAmountChange, onBuyoutSubmit, onAcknowledge,
}: AIScenarioQuestionProps) {
  const stepStyle = SCENARIO_STEP_STYLES[scenarioStep || 'environment']
  const isDecisionStep = scenarioStep === 'decision'
  const isInfoStep = scenarioStep === 'environment' || scenarioStep === 'consequence'
  const isProblemStep = scenarioStep === 'problem'
  const isBuyout = questionId === 'Q_3_BUYOUT_DECISION'
  const steps = ['environment', 'problem', 'decision', 'consequence']

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const s = SCENARIO_STEP_STYLES[step]
            const isCurrent = step === scenarioStep
            const isPast = steps.indexOf(scenarioStep || '') > i
            return (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all', isCurrent ? 'ring-2 ring-offset-1' : '', isPast ? 'opacity-50' : '')}
                  style={{ backgroundColor: isCurrent ? `${s.color}20` : isPast ? `${s.color}10` : 'var(--muted)', color: (isCurrent || isPast) ? s.color : 'var(--muted-foreground)', boxShadow: isCurrent ? `0 0 0 2px ${s.color}` : 'none' }}
                >
                  {s.icon}
                </div>
                {i < 3 && <div className="w-4 h-0.5 bg-muted-foreground/20" />}
              </div>
            )
          })}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stepStyle.color }}>{stepStyle.label}</span>
      </div>

      {/* Context */}
      {contextText && scenarioGroup !== 'investor_panel' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('p-4 rounded-xl border text-sm leading-relaxed', stepStyle.bgColor)}
          style={{ borderColor: `${stepStyle.color}30` }}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: stepStyle.color }}>{stepStyle.icon} {stepStyle.label}</div>
          <p className="text-foreground/80 whitespace-pre-line">{contextText}</p>
        </motion.div>
      )}

      {/* Investor panel */}
      {scenarioGroup === 'investor_panel' && contextText && (
        <div className="space-y-3">
          {parseInvestorPanelQuestions(contextText).map((entry, idx) => (
            <motion.div key={`${entry.investorName}-${idx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + idx * 0.04 }} className="rounded-xl border bg-card/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {idx + 1}</div>
                  <div className="font-semibold text-sm">{entry.investorName}</div>
                </div>
                <QuestionAudioPlayer audioKeys={entry.voiceKeys} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{entry.question}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Decision step */}
      {isDecisionStep && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          {isBuyout ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Accept buyout */}
              <div className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div>
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Accept Buyout Deal</h4>
                  <p className="text-xs text-muted-foreground mt-1">Exit now with a guaranteed return.</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Acquiring Company Name</label>
                    <input type="text" value={buyoutCompany} onChange={e => onBuyoutCompanyChange(e.target.value)} placeholder="e.g. Google, Target" className="w-full mt-1 bg-background/50 border border-emerald-500/30 rounded-md py-1.5 px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Deal Value ($)</label>
                    <input type="number" value={buyoutAmount} onChange={e => onBuyoutAmountChange(e.target.value)} placeholder="e.g. 5000000" className="w-full mt-1 bg-background/50 border border-emerald-500/30 rounded-md py-1.5 px-3 text-sm" />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBuyoutSubmit} disabled={submitting} className="w-full bg-emerald-600/90 text-white text-sm font-bold py-2 rounded-md hover:bg-emerald-600 transition">Confirm</motion.button>
                  {submitError && <p className="text-xs text-red-500 mt-1">{submitError}</p>}
                </div>
              </div>
              {/* Enter War Room */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => onTextChange('I choose to WALK OUT OF THE DEAL and ENTER THE WAR ROOM for investments.')}
                className={cn('p-6 rounded-2xl border-2 text-left space-y-3 transition-all group', currentAnswer?.text?.includes('WALK OUT') ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted')}
              >
                <div className="h-10 w-10 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldAlert className="h-6 w-6" /></div>
                <div>
                  <h4 className="font-bold">Enter War Room</h4>
                  <p className="text-xs text-muted-foreground mt-1">Reject the buyout. Fight for valuation and retain control.</p>
                </div>
                <div className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Prepare for War <ChevronRight className="h-3 w-3" /></div>
              </motion.button>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-400">How do you respond to this situation?</div>
              <Textarea placeholder="Describe your decision and reasoning..." value={currentAnswer?.text || ''} onChange={e => onTextChange(e.target.value)} rows={5} className="resize-none" />
            </>
          )}
        </motion.div>
      )}

      {/* Info / consequence acknowledge */}
      {(isInfoStep || isProblemStep) && !currentAnswer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
          <Button variant="outline" size="sm" onClick={onAcknowledge} className="text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{isProblemStep ? 'I understand the problem — Continue' : 'I understand — Continue'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
