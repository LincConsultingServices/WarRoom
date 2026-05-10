
import { AlertTriangle, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FadeInUp } from '@/src/components/AnimatedComponents';
import type { SimOption } from '@/src/types';

interface ScenarioQuestionProps {
  questionText: string;
  options: SimOption[];
  currentAnswerSelectedOptionId?: string;
  currentAnswerText?: string;
  followupScenarios: Record<string, { question: string }>;
  followupError: Record<string, string>;
  loadingFollowup: Record<string, boolean>;
  onSelectOption: (opt: SimOption) => void;
  onConfirmDecision: (opt: SimOption) => void;
  onTextChange: (text: string) => void;
  onRetryFollowup: (opt: SimOption) => void;
  mcqFeedback?: string | null;
}

export function ScenarioQuestion({
  questionText,
  options,
  currentAnswerSelectedOptionId,
  currentAnswerText,
  followupScenarios,
  followupError,
  loadingFollowup,
  onSelectOption,
  onConfirmDecision,
  onTextChange,
  onRetryFollowup,
  mcqFeedback,
}: ScenarioQuestionProps) {
  const currentQId = questionText; // Assuming questionText can serve as a unique ID for this component's context

  return (
    <div className="space-y-3">
      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Choose your decision wisely — this scenario tests your real-world judgment
      </div>
      {options.map((opt: SimOption, optIdx: number) => {
        const isSelected = currentAnswerSelectedOptionId === opt.id;
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: optIdx * 0.05 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectOption(opt)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex flex-col",
              isSelected ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-medium" : "border-border hover:border-amber-400/50 hover:bg-muted/30"
            )}
          >
            <span>{opt.text}</span>
            {isSelected && opt.warning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {opt.warning}
              </motion.div>
            )}
          </motion.button>
        );
      })}
      {mcqFeedback && currentAnswerSelectedOptionId && !followupScenarios[currentQId] && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Mentor insight: </span>{mcqFeedback}
        </div>
      )}

      {/* FOLLOWUP BRANCHING SECTION */}
      {(loadingFollowup[currentQId] || followupScenarios[currentQId] || followupError[currentQId]) && currentAnswerSelectedOptionId ? (
        <FadeInUp className="mt-6 pl-4 border-l-2 border-amber-500/40 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Consequence</span>
          </div>

          {loadingFollowup[currentQId] ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm italic text-amber-700 dark:text-amber-400">AI is developing the scenario consequence...</span>
            </div>
          ) : followupError[currentQId] ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line text-red-900 dark:text-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="font-bold">Follow-up Scenario Failed</span>
                </div>
                {followupError[currentQId]}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const selectedOption = options?.find((o) => o.id === currentAnswerSelectedOptionId);
                  if (selectedOption) {
                    onRetryFollowup(selectedOption);
                  }
                }}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40"
              >
                Retry Generating Consequence
              </Button>
            </div>
          ) : followupScenarios[currentQId] && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line text-amber-900 dark:text-amber-100">
                {followupScenarios[currentQId].question}
              </div>

              <div className="pt-2">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> How do you manage this consequence?
                </div>
                <Textarea
                  placeholder="Type your strategic response here..."
                  value={currentAnswerText || ""}
                  onChange={(e) => onTextChange(e.target.value)}
                  rows={4}
                  className="resize-none border-amber-200 dark:border-amber-800 focus:border-amber-500 transition-colors text-sm"
                />
              </div>
            </div>
          )}
        </FadeInUp>
      ) : currentAnswerSelectedOptionId ? (
        <FadeInUp className="mt-4 flex justify-end">
          <Button
            onClick={() => onConfirmDecision(options?.find(o => o.id === currentAnswerSelectedOptionId)!)}
            className="w-full sm:w-auto"
          >
            Confirm Decision <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </FadeInUp>
      ) : null}
    </div>
  );
}
