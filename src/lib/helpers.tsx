// ============================================
// War Room – Shared Helper Functions
// ============================================

import { FileText, AlertTriangle, Target, DollarSign, Lightbulb } from 'lucide-react'
import { INVESTOR_VOICE_ALIASES } from './constants'
import type { AssessmentState } from '@/src/types'

// ---- Stage / Question labels ----

export function stageLabel(s: string): string {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
}

export function getQuestionTypeLabel(type: string): string {
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

export function getQuestionTypeIcon(type: string) {
  switch (type) {
    case 'scenario': return <AlertTriangle className="h-3.5 w-3.5" />
    case 'multiple_choice': return <Target className="h-3.5 w-3.5" />
    case 'budget_allocation': return <DollarSign className="h-3.5 w-3.5" />
    case 'ai_scenario': return <Lightbulb className="h-3.5 w-3.5" />
    case 'info': return <FileText className="h-3.5 w-3.5" />
    default: return <FileText className="h-3.5 w-3.5" />
  }
}

export function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'scenario': return '#f59e0b'
    case 'multiple_choice': return '#3b82f6'
    case 'budget_allocation': return '#10b981'
    case 'ai_scenario': return '#ef4444'
    case 'info': return '#06b6d4'
    default: return '#8b5cf6'
  }
}

// ---- Voice / Audio helpers ----

export function normalizeVoiceSlug(value: string): string {
  const trimmed = value.trim()
  return INVESTOR_VOICE_ALIASES[trimmed] || trimmed
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getVoiceKeysForName(value: string): string[] {
  const normalized = normalizeVoiceSlug(value)
  return normalized ? [normalized] : []
}

// Parse structured investor panel Q lines: `Name: "Question"`
export function parseInvestorPanelQuestions(
  contextText: string
): Array<{ investorName: string; question: string; voiceKeys: string[] }> {
  return contextText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s*['"](.+?)['"]$/)
      if (!match) return null
      const investorName = match[1].trim()
      const question = match[2].trim()
      return { investorName, question, voiceKeys: getVoiceKeysForName(investorName) }
    })
    .filter((item): item is { investorName: string; question: string; voiceKeys: string[] } => item !== null)
}

// ---- War Room helpers ----

type PreviousResponseEntry = Record<string, unknown>

export function normalizePreviousResponses(raw: unknown): PreviousResponseEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is PreviousResponseEntry => typeof item === 'object' && item !== null)
        : []
    } catch {
      return []
    }
  }
  return []
}

export function getPreparedPitchFromState(state: AssessmentState | null): string {
  const directPitch = state?.assessment?.warRoomPitch?.trim()
  if (directPitch) return directPitch

  const previousResponses = normalizePreviousResponses(state?.assessment?.previousResponses)
  for (let i = previousResponses.length - 1; i >= 0; i--) {
    const entry = previousResponses[i] as Record<string, unknown>
    const questionId = String(entry.questionId || entry.qId || entry.question_id || entry.q_id || '').toUpperCase()
    const question = String(entry.q || entry.question || entry.questionText || entry.text || '').toLowerCase()
    const answer = String(entry.a || entry.answer || entry.response || entry.selectedOptionText || entry.text || '').trim()
    if (!answer) continue
    if (
      questionId === 'Q_WP_1' ||
      question.includes('pitch template') ||
      question.includes('war room pitch') ||
      question.includes('prepared pitch')
    ) {
      return answer
    }
  }
  return ''
}
