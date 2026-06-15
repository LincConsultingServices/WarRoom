// ============================================
// War Room – Shared Constants
// ============================================

import type { LucideIcon } from 'lucide-react'
import { Globe, AlertTriangle, Target, BarChart3 } from 'lucide-react'
import type { StageName } from '@/src/types'


// Stage accent colours — GOT themed
export const STAGE_THEMES: Record<string, string> = {
  STAGE_NEG2_IDEATION: '#6b5a8e',     // Dragonglass purple
  STAGE_NEG1_VISION: '#7c5a9e',       // Raven's wing purple
  STAGE_0_COMMITMENT: '#c9a227',      // Lannister Gold
  STAGE_1_VALIDATION: '#4a7c59',      // Stark green (Godswood)
  STAGE_2A_GROWTH: '#3d6b8e',         // Castle Black steel blue
  STAGE_2B_EXPANSION: '#2e7d82',      // Braavosi teal
  STAGE_3_SCALE: '#c9a227',           // Molten Gold
  STAGE_WARROOM_PREP: '#8b3a1a',      // Dragonstone burnt orange-red
  STAGE_4_WARROOM: '#8b1a1a',         // Dragon fire blood red
}

// Cinematic narration metadata per stage
export const STAGE_NARRATIVES: Record<string, { month: string; title: string; desc: string }> = {
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

// Stage-specific mentor tip messages
export const STAGE_MENTOR_TIPS: Record<string, string> = {
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

// Ordered list of all stages
export const STAGE_ORDER: StageName[] = [
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

// Stage durations in minutes (from SOP)
export const STAGE_DURATIONS: Record<string, number> = {
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

// Short labels shown on stage timeline
export const NARRATION_STAGE_LABELS = ['Idea', 'Vision', 'Commit', 'Validate', 'Grow', 'Expand', 'Scale', 'Prep', 'War Room']

// Investor voice filename overrides, keyed by investor id (stable across rename)
export const INVESTOR_VOICE_BY_ID: Record<string, string> = {
  master_coin: 'master_coin',
  lord_hustle: 'lord_hustle',
  mother_instinct: 'mother_instinct',
  hand_execution: 'hand_execution',
  spider_strategy: 'spider_strategy',
  warden_trust: 'warden_trust',
  mirror_identity: 'mirror_identity',
}

// Maps the public display title back to the stable investor id.
// Investor panel context_text shows the title; we resolve it here to look up
// voice assets and other id-keyed resources.
export const INVESTOR_TITLE_TO_ID: Record<string, string> = {
  'The Mirror of Identity': 'mirror_identity',
  'The Master of Coin': 'master_coin',
  'The Lord of Hustle': 'lord_hustle',
  'The Mother of Instinct': 'mother_instinct',
  'The Hand of Execution': 'hand_execution',
  'The Spider of Strategy': 'spider_strategy',
  'The Warden of Trust': 'warden_trust',
}

// Scenario step styling — icons are lucide components (on-brand SVG, no emoji).
export const SCENARIO_STEP_STYLES: Record<string, { icon: LucideIcon; label: string; color: string; bgColor: string }> = {
  environment: { icon: Globe, label: 'ENVIRONMENT', color: '#3d6b8e', bgColor: 'bg-[#3d6b8e]/10 dark:bg-[#3d6b8e]/20' },
  problem: { icon: AlertTriangle, label: 'PROBLEM', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  decision: { icon: Target, label: 'YOUR DECISION', color: '#7c5a9e', bgColor: 'bg-[#7c5a9e]/10 dark:bg-[#7c5a9e]/20' },
  consequence: { icon: BarChart3, label: 'CONSEQUENCE', color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
}
