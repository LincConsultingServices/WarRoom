'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Send, Loader2, Lightbulb, Target, Coins, UserRound, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FadeInUp } from '@/src/components/AnimatedComponents'
import { QuestionAudioPlayer } from '@/src/components/QuestionAudioPlayer'
import { getQuestionTypeColor, getQuestionTypeIcon, getQuestionTypeLabel } from '@/src/lib/helpers'
import { cn } from '@/lib/utils'
import type { SimOption, SimQuestion } from '@/src/types'

const SECTION_ICONS: Record<string, LucideIcon> = {
  'The Idea': Lightbulb, 'Market Reality': Target, 'Money & Model': Coins, 'Founder Fit': UserRound,
}

interface IdeationViewProps {
  questions: SimQuestion[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers: Record<string, any>
  answeredCount: number
  submitting: boolean
  submitError: string
  accent: string
  onTextChange: (text: string, qId: string) => void
  onSelectOption: (opt: SimOption, qId: string) => void
  onSubmitPhase: () => void
}

export function IdeationView({
  questions, answers, submitting, submitError, accent,
  onTextChange, onSelectOption, onSubmitPhase,
}: IdeationViewProps) {
  // Group by section
  const sections: Record<string, SimQuestion[]> = {}
  questions.forEach(q => {
    const sec = q.section || 'General'
    if (!sections[sec]) sections[sec] = []
    sections[sec].push(q)
  })

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Define Your Business Idea</h1>
        <p className="text-sm text-muted-foreground">Complete all sections below. This is your foundation — be specific and thoughtful.</p>
      </div>

      {Object.entries(sections).map(([sectionName, sectionQuestions], secIdx) => (
        <FadeInUp key={sectionName} delay={0.1 + secIdx * 0.1}>
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                {(() => {
                  const SectionIcon = SECTION_ICONS[sectionName] ?? PenLine
                  return <SectionIcon className="h-4 w-4" style={{ color: accent }} />
                })()}
              </div>
              <div>
                <h2 className="text-base font-semibold">{sectionName}</h2>
                <p className="text-xs text-muted-foreground">{sectionQuestions.length} questions</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {sectionQuestions.map((q, idx) => {
                const answer = answers[q.q_id]
                const typeColor = getQuestionTypeColor(q.type)
                return (
                  <div key={q.q_id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-muted-foreground mt-1 w-6 flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: `${typeColor}60`, color: typeColor }}>
                            {getQuestionTypeIcon(q.type)}{getQuestionTypeLabel(q.type)}
                          </Badge>
                          {answer && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <Label className="text-sm font-medium leading-snug block mt-1">{q.text}</Label>
                          <QuestionAudioPlayer audioKey={q.q_id} />
                        </div>
                        {q.context_text && <p className="text-xs text-muted-foreground">{q.context_text}</p>}

                        {q.type === 'open_text' && (
                          <Textarea placeholder="Type your response..." value={(answer as any)?.text || ''} onChange={e => onTextChange(e.target.value, q.q_id)} rows={3} className="resize-none text-sm" /> // eslint-disable-line @typescript-eslint/no-explicit-any
                        )}
                        {(q.type === 'multiple_choice' || q.type === 'scenario') && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt: SimOption) => {
                              const isSelected = answer?.selectedOptionId === opt.id
                              return (
                                <button key={opt.id} onClick={() => onSelectOption(opt, q.q_id)}
                                  className={cn('w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm', isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/30')}
                                >
                                  {opt.text}
                                </button>
                              )
                            })}
                            {answer?.selectedOptionId && (() => {
                              const sel = q.options?.find(o => o.id === answer.selectedOptionId)
                              return sel?.feedback ? (
                                <div className="p-2.5 rounded-lg bg-[color:var(--color-chessboard-gold)]/[0.08] border border-[color:var(--color-chessboard-gold)]/30 text-xs text-[color:var(--color-chessboard-ivory)]/85">
                                  <span className="font-medium">Insight: </span>{sel.feedback}
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    {idx < sectionQuestions.length - 1 && <hr className="border-border/50" />}
                  </div>
                )
              })}
            </div>
          </div>
        </FadeInUp>
      ))}

      <div className="flex justify-center pb-6">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onSubmitPhase} disabled={submitting} size="lg" className="px-8" style={{ backgroundColor: accent }}>
            {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Evaluating Ideation...</> : <><Send className="h-5 w-5 mr-2" />Submit Ideation & Enter Simulation</>}
          </Button>
        </motion.div>
      </div>
      {submitError && <div className="text-center"><p className="text-sm text-red-500">{submitError}</p></div>}
    </div>
  )
}
