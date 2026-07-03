// ============================================
// War Room — Codex (chess/strategy plain language)
// Central definitions for themed terms, surfaced via <LoreTip>.
// ============================================

export const LORE = {
  renown:
    'Rating — your performance score, earned by making strong decisions across assessment stages. It raises your Title.',
  founderRank:
    'Founder Title — your prestige tier, from Candidate Master up to Grandmaster, earned by accumulating Rating points.',
  ranking:
    'Your live position on this cohort\'s leaderboard, ranked by projected performance score.',
  constellation:
    'Each node represents one of your eight founder competencies. It strengthens as you demonstrate mastery across stages.',
  sigil:
    'Emblems are achievements for genuine tactical feats — earned through merit, never shortcuts.',
  hearth:
    'The Streak tracks your weekly consistency. Keep it active by returning each week to the board.',
  house:
    'Your Chess Club is your identity — emblem, motto, and colors. New options unlock as your title rises.',
  ironRankings:
    'The Elo Ratings place every founder in your cohort by projected performance.',
  legacyScore:
    'Your performance score is the evaluators\' average verdict from a completed assessment.',
} as const

export type LoreKey = keyof typeof LORE
