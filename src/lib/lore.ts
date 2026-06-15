// ============================================
// War Room — Codex (lore → plain language)
// ----------------------------------------------------------------
// Central plain-language definitions for the themed terms, surfaced
// via <LoreTip>. Keeps the GoT metaphors atmospheric without
// sacrificing comprehension. One source of truth for the copy.
// ============================================

export const LORE = {
  renown:
    'Renown — your prestige score, earned by making strong decisions in trials. It raises your Founder Rank.',
  founderRank:
    'Founder Rank — your prestige tier, from Aspirant up to Ruler of the Realm, earned by accumulating Renown.',
  ranking:
    'Your live position on this cohort’s leaderboard, ranked by projected revenue.',
  constellation:
    'Each star is one of your eight founder competencies. It brightens as you master that skill across trials.',
  sigil:
    'Sigils are achievements for genuine feats — earned through merit, never bought.',
  hearth:
    'The Hearth tracks your weekly consistency. Keep it lit by returning each week.',
  house:
    'Your House is your identity — crest, words, and colours. New options unlock as your rank rises.',
  ironRankings:
    'The Iron Rankings rank every founder in your cohort by projected revenue.',
  legacyScore:
    'Your legacy score is the investors’ average verdict from a completed trial.',
} as const

export type LoreKey = keyof typeof LORE
