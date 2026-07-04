'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff, Loader2, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Investor } from '@/src/types'

interface PitchAnalysis {
  clarity: number
  confidence: number
  persuasion: number
  feedback: string
  [key: string]: unknown
}

interface PitchPhaseProps {
  leadInvestor: Investor | undefined
  preparedPitch: string
  pitchText: string
  pitchAnalysis: PitchAnalysis | null
  isAnalyzing: boolean
  isSubmitting: boolean
  error: string
  pitchRecorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder>
  onPitchTextChange: (v: string) => void
  onSubmitPitch: () => void
  onContinue: () => void
}

function RecordingButton({ recorder }: { recorder: ReturnType<typeof import('@/src/hooks/useAudioRecorder').useAudioRecorder> }) {
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
  leadInvestor, preparedPitch, pitchAnalysis,
  isAnalyzing, isSubmitting, error,
  pitchRecorder,
  onSubmitPitch, onContinue,
}: PitchPhaseProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
          {leadInvestor ? `${leadInvestor.name} is listening` : 'Pitch Phase'}
        </div>
        <h1 className="text-3xl font-black text-white">Deliver Your Pitch</h1>
        {leadInvestor && <p className="text-gray-400 text-sm">Recorded as audio — speak clearly and confidently</p>}
      </div>

      {preparedPitch && !pitchAnalysis && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Prepared Pitch</div>
          <p className="leading-relaxed whitespace-pre-line">{preparedPitch}</p>
        </div>
      )}

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {!pitchAnalysis && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 text-center">
          <RecordingButton recorder={pitchRecorder} />
          {pitchRecorder.audioBlob && (
            <Button onClick={onSubmitPitch} disabled={isAnalyzing || isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
              {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing pitch...</> : 'Submit Pitch'}
            </Button>
          )}
        </div>
      )}

      {pitchAnalysis && (
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
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">{leadInvestor?.name ? `${leadInvestor.name}'s reaction` : 'Investor reaction'}</div>
            <p>{pitchAnalysis.feedback}</p>
          </div>
          <Button onClick={onContinue} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
            Continue to Investor Q&A <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
