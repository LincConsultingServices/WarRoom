
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SimQuestion, PhaseResponse } from '@/src/types';

interface SimulationControlsProps {
  questions: SimQuestion[];
  qIndex: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  goBack: () => void;
  goNext: () => void;
  handleSubmitPhase: () => void;
  submitting: boolean;
  accent: string;
  submitError: string;
  currentAnswer: PhaseResponse | undefined;
}

export function SimulationControls({
  questions,
  qIndex,
  isFirstQuestion,
  isLastQuestion,
  goBack,
  goNext,
  handleSubmitPhase,
  submitting,
  accent,
  submitError,
  currentAnswer,
}: SimulationControlsProps) {
  return (
    <div className="px-6 py-4 border-t flex items-center justify-between gap-4">
      <Button variant="outline" onClick={goBack} disabled={isFirstQuestion} size="sm">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-1.5">
        {questions.map((_q: SimQuestion, i: number) => (
          <button
            key={i}
            onClick={() => { /* setQIndex(i); setMcqFeedback(null) */ }}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === qIndex ? 'bg-primary scale-125' : (currentAnswer && (questions[i].q_id in currentAnswer)) ? 'bg-primary/40' : 'bg-muted-foreground/20'
            )}
          />
        ))}
      </div>

      {isLastQuestion ? (
        <Button onClick={handleSubmitPhase} disabled={submitting} size="sm" style={{ backgroundColor: accent }}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />Evaluating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />Submit Phase
            </>
          )}
        </Button>
      ) : (
        <Button onClick={goNext} size="sm">
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}

      {submitError && (
        <div className="px-6 pb-4 absolute bottom-0 left-0 w-full text-center">
          <p className="text-sm text-red-500">{submitError}</p>
        </div>
      )}
    </div>
  );
}
