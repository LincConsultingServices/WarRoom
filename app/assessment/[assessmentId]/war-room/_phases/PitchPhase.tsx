'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2, RefreshCw, Volume2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
import type { Investor } from '@/src/types'

interface PitchPhaseProps {
  leadInvestor: Investor | undefined
  preparedPitch: string
  pitchText: string
  pitchAnalysis: any | null
  followupPhase: 'initial' | 'followup_pending' | 'followup_answered'
  followupQuestion: string
  responseTranscription: string
  currentInvestorReaction: string
  feedbackResponseSubmitted: boolean
  isAnalyzing: boolean
  isSubmitting: boolean
  isPlayingAudio: boolean
  error: string
  pitchRecorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder>
  responseRecorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder>
  onPitchTextChange: (v: string) => void
  onSubmitPitch: () => void
  onSubmitFollowup: () => void
  onContinue: () => void
}

function RecordingButton({ recorder, maxLabel }: { recorder: any; maxLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      {recorder.isRecording ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
            <button onClick={recorder.stopRecording} className="relative h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all">
              <MicOff className="h-7 w-7 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording {recorder.recordingTime}s / {recorder.maxDuration}s
          </div>
        </div>
      ) : (
        <button
          onClick={recorder.startRecording}
          disabled={!!recorder.audioBlob}
          className={cn('h-16 w-16 rounded-full flex items-center justify-center transition-all', recorder.audioBlob ? 'bg-green-600/20 border-2 border-green-500' : 'bg-red-600 hover:bg-red-700')}
        >
          {recorder.audioBlob ? <CheckCircle2 className="h-7 w-7 text-green-500" /> : <Mic className="h-7 w-7 text-white" />}
        </button>
      )}
      {recorder.audioBlob && (
        <Button variant="ghost" size="sm" onClick={recorder.resetRecording} className="text-xs text-muted-foreground gap-1">
          <RefreshCw className="h-3 w-3" />Re-record
        </Button>
      )}
    </div>
  )
}

export function PitchPhase({
  leadInvestor, preparedPitch, pitchText, pitchAnalysis, followupPhase, followupQuestion,
  responseTranscription, currentInvestorReaction, feedbackResponseSubmitted,
  isAnalyzing, isSubmitting, isPlayingAudio, error,
  pitchRecorder, responseRecorder,
  onPitchTextChange, onSubmitPitch, onSubmitFollowup, onContinue,
}: PitchPhaseProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
          {leadInvestor ? `${leadInvestor.name} is listening` : 'Pitch Phase'}
        </div>
        <h1 className="text-3xl font-black text-white">Deliver Your Pitch</h1>
        {leadInvestor && <p className="text-gray-400 text-sm">Recorded as audio — speak clearly and confidently</p>}
      </div>

      {/* Prepared pitch reference */}
      {preparedPitch && !pitchAnalysis && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Prepared Pitch</div>
          <p className="leading-relaxed whitespace-pre-line">{preparedPitch}</p>
        </div>
      )}

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Phase: Initial — record pitch */}
      {followupPhase === 'initial' && !pitchAnalysis && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 text-center">
          <RecordingButton recorder={pitchRecorder} maxLabel="60s" />
          {pitchRecorder.audioBlob && (
            <Button onClick={onSubmitPitch} disabled={isAnalyzing || isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
              {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing pitch...</> : 'Submit Pitch'}
            </Button>
          )}
        </div>
      )}

      {/* Pitch analysis */}
      {pitchAnalysis && followupPhase === 'initial' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[['Clarity', pitchAnalysis.clarity], ['Confidence', pitchAnalysis.confidence], ['Persuasion', pitchAnalysis.persuasion]].map(([label, score]) => (
              <div key={label as string} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">{score}<span className="text-sm text-gray-400">/10</span></div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Feedback</div>
            <p>{pitchAnalysis.feedback}</p>
          </div>
          {/* No followup was generated (no investor / API failure) — allow continuing */}
          <Button onClick={onContinue} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
            Continue to Investor Q&A <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      )}


      {/* Follow-up question */}
      {followupPhase === 'followup_pending' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2">
              {isPlayingAudio && <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />}
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{leadInvestor?.name || 'Lead Investor'} asks:</span>
            </div>
            <p className="text-white font-medium">{followupQuestion}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-center">
            <div className="text-sm text-gray-400">Record your response (max 15s)</div>
            <RecordingButton recorder={responseRecorder} maxLabel="15s" />
            {responseRecorder.audioBlob && (
              <Button onClick={onSubmitFollowup} disabled={isAnalyzing || isSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : 'Submit Response'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Follow-up answered */}
      {followupPhase === 'followup_answered' && (
        <div className="space-y-4">
          {responseTranscription && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Your response</div>
              <p>{responseTranscription}</p>
            </div>
          )}
          {currentInvestorReaction && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300">
              <div className="text-xs font-bold text-green-500 uppercase mb-2">{leadInvestor?.name || 'Investor'} reaction</div>
              <p>{currentInvestorReaction}</p>
            </div>
          )}
          <Button onClick={onContinue} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
            Continue to Investor Q&A <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
