
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SimQuestion } from '@/src/types';

interface AIConceptQuestionProps {
  currentQ: SimQuestion;
  currentAnswerText?: string;
  onTextChange: (text: string) => void;
  onAcknowledge: () => void;
}

// Scenario step styling (duplicated from page.tsx for now, ideally moved to constants)
const SCENARIO_STEP_STYLES: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  environment: { icon: 'ENV', label: 'ENVIRONMENT', color: '#3b82f6', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  problem: { icon: 'PROB', label: 'PROBLEM', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  decision: { icon: 'DEC', label: 'YOUR DECISION', color: '#8b5cf6', bgColor: 'bg-violet-50 dark:bg-violet-900/20' },
  consequence: { icon: 'RESULT', label: 'CONSEQUENCE', color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

export function AIConceptQuestion({
  currentQ,
  currentAnswerText,
  onTextChange,
  onAcknowledge,
}: AIConceptQuestionProps) {
  const stepStyle = SCENARIO_STEP_STYLES[currentQ.scenario_step || 'environment'];
  const isDecisionStep = currentQ.scenario_step === 'decision';
  const isInfoStep = currentQ.scenario_step === 'environment' || currentQ.scenario_step === 'consequence';

  return (
    <div className="space-y-4">
      {/* Scenario step indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {['environment', 'problem', 'decision', 'consequence'].map((step, i) => {
            const s = SCENARIO_STEP_STYLES[step];
            const isCurrent = step === currentQ.scenario_step;
            const isPast = ['environment', 'problem', 'decision', 'consequence'].indexOf(currentQ.scenario_step || '') > i;
            return (
              <div key={step} className="flex items-center gap-1">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isCurrent ? `${s.color}20` : isPast ? `${s.color}10` : 'var(--muted)',
                    color: isCurrent || isPast ? s.color : 'var(--muted-foreground)',
                    boxShadow: isCurrent ? `0 0 0 2px ${s.color}` : 'none',
                  }}>
                  {s.icon}
                </div>
                {i < 3 && <div className="w-4 h-0.5 bg-muted-foreground/20" />}
              </div>
            );
          })}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stepStyle.color }}>
          {stepStyle.label}
        </span>
      </div>

      {/* Scenario group badge */}
      {currentQ.scenario_group && (
        <div className="text-xs text-muted-foreground font-medium mb-2">
          {currentQ.scenario_group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </div>
      )}

      {/* Context card */}
      {currentQ.context_text && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'p-4 rounded-xl border text-sm leading-relaxed',
            stepStyle.bgColor
          )}
          style={{ borderColor: `${stepStyle.color}30` }}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: stepStyle.color }}>
            {stepStyle.icon} {stepStyle.label}
          </div>
          <p className="text-foreground/80 whitespace-pre-line">{currentQ.context_text}</p>
        </motion.div>
      )}

      {/* Decision step: open text for user response OR specific Buyout UI */}
      {isDecisionStep && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {currentQ.q_id === 'Q_3_BUYOUT_DECISION' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Accept Buyout Deal</h4>
                  <p className="text-xs text-muted-foreground mt-1">Exit now with a guaranteed return and scale under new ownership.</p>
                </div>
                {/* Simplified Buyout UI */}
                <Button disabled>Buyout functionality is separate.</Button>
              </div>

              <Button disabled>Walkout functionality is separate.</Button>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                How do you respond to this situation?
              </div>
              <Textarea
                placeholder="Describe your decision and reasoning..."
                value={currentAnswerText || ""}
                onChange={(e) => onTextChange(e.target.value)}
                rows={5}
                className="resize-none border-violet-200 dark:border-violet-800 focus:border-violet-500"
              />
            </>
          )}
        </motion.div>
      )}

      {/* Info steps (environment/consequence): auto-acknowledge */}
      {(isInfoStep || currentQ.scenario_step === 'problem') && !currentAnswerText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            I understand — Continue
          </Button>
        </motion.div>
      )}
    </div>
  );
}
