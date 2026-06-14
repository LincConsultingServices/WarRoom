// ============================================
// War Room — Progression catalog & pure helpers
// ----------------------------------------------------------------
// DEFINITIONS live here (ranks, sigils, palettes, competency copy)
// so visuals/copy ship without a backend round-trip. The BACKEND owns
// the authoritative renown number + which sigil IDs are earned.
//
// No React, no side effects — pure data + functions (easy to unit-test).
// ============================================

import type {
  CompetencyCode,
  CompetencyCategory,
  RankProgress,
  SigilTierName,
} from '@/src/types'

// ------------------------------------------------------------------
// Founder Ranks — the prestige ladder. Thresholds are tunable here;
// the backend awards the renown, this maps renown → rank for display.
// ------------------------------------------------------------------

export interface RankDef {
  tier: number
  title: string
  /** Cumulative renown required to reach this rank. */
  threshold: number
}

export const RANKS: RankDef[] = [
  { tier: 0, title: 'Aspirant', threshold: 0 },
  { tier: 1, title: 'Squire', threshold: 500 },
  { tier: 2, title: 'Knight of the Realm', threshold: 1_500 },
  { tier: 3, title: 'Bannerlord', threshold: 3_500 },
  { tier: 4, title: 'Warden', threshold: 7_000 },
  { tier: 5, title: 'Hand of the King', threshold: 12_000 },
  { tier: 6, title: 'Ruler of the Realm', threshold: 20_000 },
]

/** Map a total renown value to a fully-resolved RankProgress. */
export function rankForRenown(renown: number): RankProgress {
  const safe = Math.max(0, Math.floor(renown || 0))
  let current = RANKS[0]
  for (const r of RANKS) {
    if (safe >= r.threshold) current = r
    else break
  }
  const next = RANKS.find((r) => r.tier === current.tier + 1)
  return {
    tier: current.tier,
    title: current.title,
    renownIntoTier: safe - current.threshold,
    renownForNextTier: next ? next.threshold - current.threshold : null,
  }
}

/** 0–1 fraction of progress through the current rank (1 at max rank). */
export function rankFraction(rank: RankProgress): number {
  if (rank.renownForNextTier == null || rank.renownForNextTier <= 0) return 1
  return Math.min(1, Math.max(0, rank.renownIntoTier / rank.renownForNextTier))
}

// ------------------------------------------------------------------
// Competency mastery — category ↔ tier (1–5) and on-brand colours.
// weightedAverage scale is 1.0–3.0 (see CompetencyCategory comments).
// ------------------------------------------------------------------

export const CATEGORY_TIER: Record<CompetencyCategory, number> = {
  HIGH_RISK: 1,
  DEVELOPMENT_REQUIRED: 2,
  FUNCTIONAL: 3,
  STRONG: 4,
  NATURAL_DOMINANT: 5,
}

export const CATEGORY_LABEL: Record<CompetencyCategory, string> = {
  HIGH_RISK: 'High Risk',
  DEVELOPMENT_REQUIRED: 'Developing',
  FUNCTIONAL: 'Functional',
  STRONG: 'Strong',
  NATURAL_DOMINANT: 'Natural-Born',
}

/** Star colour by tier — dim ember → molten gold as mastery rises. */
export const CATEGORY_COLOR: Record<CompetencyCategory, string> = {
  HIGH_RISK: '#6b5840',
  DEVELOPMENT_REQUIRED: '#9a7b3a',
  FUNCTIONAL: '#c9a227',
  STRONG: '#e8c84a',
  NATURAL_DOMINANT: '#fff0b8',
}

export function categoryForAverage(avg: number): CompetencyCategory {
  if (avg >= 2.7) return 'NATURAL_DOMINANT'
  if (avg >= 2.3) return 'STRONG'
  if (avg >= 2.0) return 'FUNCTIONAL'
  if (avg >= 1.6) return 'DEVELOPMENT_REQUIRED'
  return 'HIGH_RISK'
}

// ------------------------------------------------------------------
// The 8 founder competencies — display name (fallback; prefer config),
// plain-language meaning (comprehension layer), and constellation
// coordinates in a 0–200 viewBox forming a crown-like star ring.
// ------------------------------------------------------------------

export interface CompetencyMeta {
  code: CompetencyCode
  name: string
  /** One-line plain-English meaning for tooltips. */
  plain: string
  x: number
  y: number
}

export const COMPETENCY_META: CompetencyMeta[] = [
  { code: 'C1', name: 'Problem Sensing', plain: 'Spotting the real problem worth solving before anyone else.', x: 38, y: 70 },
  { code: 'C2', name: 'Learning Agility', plain: 'Updating fast when the evidence changes.', x: 72, y: 40 },
  { code: 'C3', name: 'Courage', plain: 'Making the hard call under pressure and owning it.', x: 116, y: 34 },
  { code: 'C4', name: 'Financial Discipline', plain: 'Spending like every dollar is your last — runway and unit economics.', x: 158, y: 60 },
  { code: 'C5', name: 'Strategy', plain: 'Choosing where to play and where to not play.', x: 168, y: 108 },
  { code: 'C6', name: 'Influence', plain: 'Persuading investors, customers, and your own team.', x: 132, y: 150 },
  { code: 'C7', name: 'Team Management', plain: 'Building and keeping a team that ships.', x: 86, y: 158 },
  { code: 'C8', name: 'Value Creation', plain: 'Turning effort into durable customer and business value.', x: 46, y: 122 },
]

/** Closed-loop edges between competency stars (forms the "crown"). */
export const CONSTELLATION_EDGES: Array<[CompetencyCode, CompetencyCode]> = [
  ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'],
  ['C5', 'C6'], ['C6', 'C7'], ['C7', 'C8'], ['C8', 'C1'],
]

export function competencyMeta(code: CompetencyCode): CompetencyMeta | undefined {
  return COMPETENCY_META.find((c) => c.code === code)
}

// ------------------------------------------------------------------
// Sigils (achievements) — each tied to a genuine founder feat.
// Pure data; the id → icon mapping lives in SigilCrest.tsx.
// ------------------------------------------------------------------

export interface SigilDef {
  id: string
  name: string
  /** Plain description of the feat that earns it. */
  description: string
  tier: SigilTierName
}

export const SIGILS: SigilDef[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Complete your first trial.', tier: 'BRONZE' },
  { id: 'the_committed', name: 'The Committed', description: 'Reach the War Room in any trial.', tier: 'BRONZE' },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Score 80+ persuasion on a pitch.', tier: 'SILVER' },
  { id: 'the_diplomat', name: 'The Diplomat', description: 'Negotiate a better deal than first offered.', tier: 'SILVER' },
  { id: 'the_unbroken', name: 'The Unbroken', description: 'Complete a trial without a single mentor lifeline.', tier: 'SILVER' },
  { id: 'master_of_coin', name: 'Master of Coin', description: 'Project $1M+ annual revenue.', tier: 'GOLD' },
  { id: 'dragonslayer', name: 'Dragonslayer', description: 'Close a deal with an investor.', tier: 'GOLD' },
  { id: 'natural_born', name: 'Natural-Born', description: 'Reach Natural-Born mastery in any competency.', tier: 'GOLD' },
  { id: 'the_phoenix', name: 'The Phoenix', description: 'Beat your previous legacy score by 15+.', tier: 'GOLD' },
  { id: 'iron_will', name: 'Iron Will', description: 'Keep the hearth lit for 4 weeks running.', tier: 'GOLD' },
  { id: 'the_strategist', name: 'The Strategist', description: 'Reach Strong+ in Strategy and Financial Discipline.', tier: 'GOLD' },
  { id: 'polymath', name: 'The Polymath', description: 'Reach Strong+ in all eight competencies.', tier: 'OBSIDIAN' },
  { id: 'the_sovereign', name: 'The Sovereign', description: 'Rise to Ruler of the Realm.', tier: 'OBSIDIAN' },
  { id: 'unanimous', name: 'Unanimous Verdict', description: 'Win a favourable verdict from every investor.', tier: 'OBSIDIAN' },
]

export function sigilById(id: string): SigilDef | undefined {
  return SIGILS.find((s) => s.id === id)
}

export interface SigilTierStyle {
  base: string
  bright: string
  label: string
}

export const SIGIL_TIER_COLOR: Record<SigilTierName, SigilTierStyle> = {
  BRONZE: { base: '#a05a2c', bright: '#c8814c', label: 'Bronze' },
  SILVER: { base: '#8a8f98', bright: '#c4cad2', label: 'Silver' },
  GOLD: { base: '#c9a227', bright: '#e8c84a', label: 'Gold' },
  OBSIDIAN: { base: '#3a2a52', bright: '#7a5ca0', label: 'Obsidian' },
}

// ------------------------------------------------------------------
// House identity — palettes & crest shapes unlock by rank (earned,
// never purchased). All palette colours are on-brand tokens.
// ------------------------------------------------------------------

export interface HousePalette {
  id: string
  name: string
  primary: string
  secondary: string
  /** Rank tier required to unlock. */
  unlockRank: number
}

export const HOUSE_PALETTES: HousePalette[] = [
  { id: 'gold', name: 'Cloth of Gold', primary: '#e8c84a', secondary: '#8b6914', unlockRank: 0 },
  { id: 'crimson', name: 'Blood & Fire', primary: '#c23b3b', secondary: '#8b1a1a', unlockRank: 0 },
  { id: 'verdant', name: 'The Greenwood', primary: '#3f9c6f', secondary: '#2d6a4f', unlockRank: 1 },
  { id: 'sapphire', name: 'Deep Waters', primary: '#3d6b8e', secondary: '#1a3a5c', unlockRank: 2 },
  { id: 'ember', name: 'Dragonfire', primary: '#ff9933', secondary: '#ff6b00', unlockRank: 3 },
  { id: 'amethyst', name: 'Twilight Court', primary: '#7a5ca0', secondary: '#4a2060', unlockRank: 4 },
]

export function paletteById(id: string): HousePalette {
  return HOUSE_PALETTES.find((p) => p.id === id) ?? HOUSE_PALETTES[0]
}

/** Crest shapes — id → display name; the icon mapping lives in SigilCrest.tsx. */
export interface HouseSigilDef {
  id: string
  name: string
  unlockRank: number
}

export const HOUSE_SIGILS: HouseSigilDef[] = [
  { id: 'blade', name: 'The Blade', unlockRank: 0 },
  { id: 'flame', name: 'The Flame', unlockRank: 0 },
  { id: 'tower', name: 'The Tower', unlockRank: 0 },
  { id: 'crown', name: 'The Crown', unlockRank: 2 },
  { id: 'wolf', name: 'The Direwolf', unlockRank: 3 },
  { id: 'dragon', name: 'The Dragon', unlockRank: 5 },
]

export function houseSigilById(id: string): HouseSigilDef {
  return HOUSE_SIGILS.find((s) => s.id === id) ?? HOUSE_SIGILS[0]
}

/** Curated house words. Customizer also allows capped free-text. */
export const HOUSE_WORDS: string[] = [
  'Build or Burn',
  'Ship Without Fear',
  'We Do Not Flinch',
  'The Bold Endure',
  'Conviction Over Comfort',
  'Forged Under Fire',
  'First, Then Fast',
  'No Throne Without Toil',
]

export const HOUSE_WORDS_MAX = 32

export const DEFAULT_HOUSE = {
  sigilId: 'blade',
  words: 'The Bold Endure',
  paletteId: 'gold',
} as const

export function isUnlocked(unlockRank: number, currentTier: number): boolean {
  return currentTier >= unlockRank
}
