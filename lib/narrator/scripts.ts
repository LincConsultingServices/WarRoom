import type { NarratorLine } from '@/src/state/narratorStore'

/**
 * NARRATOR_SCRIPTS — pre-authored dialogue lines keyed by phase.
 *
 * This file is intentionally append-only. Each slice adds the lines
 * it needs without rewriting existing entries. The landing slice
 * populates only the two `landing.*` keys; future slices populate
 * `stage.*`, `chessboard.*`, `verdict.*`, etc.
 */

export const NARRATOR_SCRIPTS: Record<string, NarratorLine[]> = {
  'landing.first-visit': [
    {
      text: 'Welcome, seeker. I am the Oracle of the Chessboard.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Before you stands the greatest trial a founder can face.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Six stages await. Then... the Chessboard.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Are you prepared to defend your vision before the Council?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'landing.returning': [
    {
      text: 'You return, lord. The Council remembers.',
      mood: 'idle',
      duration: 2800,
    },
  ],

  'dashboard.first-visit': [
    {
      text: 'Welcome to the Dashboard. This is your council chamber between trials.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'When you are ready, the trial begins beyond that door.',
      mood: 'pointing',
      highlight: 'dashboard-begin-cta',
      duration: 3400,
    },
    {
      text: 'The Elo Rankings track every founder who has dared the gauntlet.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'Choose your path, lord.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'dashboard.returning': [
    {
      text: 'The hall is quiet, lord. Your campaigns await.',
      mood: 'idle',
      duration: 2600,
    },
  ],

  'assessment.first-visit': [
    {
      text: 'The Trial has many paths, lord. Choose your rank with care.',
      mood: 'idle',
      duration: 3400,
    },
    {
      text: 'A Student walks the guided path. A Commander faces the full gauntlet.',
      mood: 'speaking',
      duration: 4000,
    },
    {
      text: 'Nine stages await — from first spark of Ideation to the Chessboard itself.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Seal your oath below, then press Enter the Trial when you are ready.',
      mood: 'pointing',
      highlight: 'assessment-start-cta',
      duration: 0,
    },
  ],

  'assessment.returning': [
    {
      text: 'You return to the threshold, lord. The Council remembers your last campaign.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'leaderboard.first-visit': [
    {
      text: 'The Elo Rankings, lord. Here, all founders are measured by the coin they command.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'Your projected revenue determines your standing among the domain.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The championship awaits the boldest.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'leaderboard.returning': [
    {
      text: 'The rankings shift with every trial. Where do you stand now, lord?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'results.first-visit': [
    {
      text: 'Results, lord. Every campaign you have fought is recorded here.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'Study your strengths and failures — the Council remembers every choice.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'The wisest commanders learn before they march again.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'results.returning': [
    {
      text: 'Your campaigns await review, lord. Has the scroll revealed new wisdom?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'history.first-visit': [
    {
      text: 'The Archives, lord. A chronicle of every question asked and answer given.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'No detail is lost here — the scribes recorded your every word.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Review your past, and the future campaigns will be sharper for it.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'history.returning': [
    {
      text: 'The archives remain as you left them, lord.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'settings.first-visit': [
    {
      text: 'The Forge, lord. Here you may temper your preferences.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Shape the Chessboard to your liking — but the trials remain the same.',
      mood: 'speaking',
      duration: 0,
    },
  ],

  'settings.returning': [
    {
      text: 'Adjusting the armour again, lord?',
      mood: 'idle',
      duration: 0,
    },
  ],

  'support.first-visit': [
    {
      text: 'If the Chessboard confounds you, seek counsel here.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'The scribes answer every summons within a day.',
      mood: 'speaking',
      duration: 0,
    },
  ],

  'support.returning': [
    {
      text: 'The Council stands ready to assist, lord.',
      mood: 'idle',
      duration: 0,
    },
  ],

  // ===================================================================
  // STAGE SCRIPTS — one per assessment stage
  // ===================================================================

  'stage.ideation.first-visit': [
    {
      text: 'The Spark, lord. Every empire begins with a single dangerous idea.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Tell the Council what problem burns in your gut — and why you alone can solve it.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Speak plainly. The investors sense weakness in vague words.',
      mood: 'warning',
      duration: 0,
    },
  ],
  'stage.ideation.returning': [
    { text: 'Back to the forge of ideas, lord. Has the spark grown brighter?', mood: 'idle', duration: 0 },
  ],

  'stage.vision.first-visit': [
    {
      text: 'Vision, lord. The Council must see the world you intend to build.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'A founder without vision is a ship without a star.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Paint the future plainly — these lords are not impressed by mere dreams.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.vision.returning': [
    { text: 'Your vision awaits refinement, lord.', mood: 'idle', duration: 0 },
  ],

  'stage.commitment.first-visit': [
    {
      text: 'The Commitment, lord. Here you stake your oath to this venture.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'The Council watches for hesitation. They invest in certainty.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Show them this is not a passing fancy — but a blood oath.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.commitment.returning': [
    { text: 'The oath was taken, lord. Does your resolve hold?', mood: 'idle', duration: 0 },
  ],

  'stage.validation.first-visit': [
    {
      text: 'Market Validation, lord. Dreams are cheap — the Council demands proof.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Show them the hunger in the market. Numbers do not lie.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'A founder who knows their market is a founder worth funding.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.validation.returning': [
    { text: 'The market evidence awaits your hand, lord.', mood: 'idle', duration: 0 },
  ],

  'stage.growth.first-visit': [
    {
      text: 'Initial Growth, lord. The seed is planted — now it must break ground.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Council watches for traction. Early signs of life.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Show them the curve bends upward.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.growth.returning': [
    { text: 'Growth pauses for no one, lord. The numbers are waiting.', mood: 'idle', duration: 0 },
  ],

  'stage.expansion.first-visit': [
    {
      text: 'Expansion, lord. The domain grows — but so do the threats.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Churn is the silent killer. The Council knows this well.',
      mood: 'speaking',
      duration: 3000,
    },
    {
      text: 'Prove you can hold what you have while reaching for more.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.expansion.returning': [
    { text: 'The expansion questions remain, lord. Press forward.', mood: 'idle', duration: 0 },
  ],

  'stage.scale.first-visit': [
    {
      text: 'Scaling Up, lord. The final trial before the Chessboard gates.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'Can your venture bear the weight of ten thousand users? A million?',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Council must believe your walls will hold.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.scale.returning': [
    { text: 'Scale waits for no one, lord. Complete your testimony.', mood: 'idle', duration: 0 },
  ],

  'stage.chessboard-prep.first-visit': [
    {
      text: 'Pitch Prep, lord. The final chance to sharpen your sword before the gate.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Beyond this point, you face the Council directly. Prepare well.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Review your answers. Tighten your story. The lords are merciless.',
      mood: 'idle',
      duration: 0,
    },
  ],
  'stage.chessboard-prep.returning': [
    { text: 'Still sharpening the blade, lord? The Chessboard draws near.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // WAR ROOM PHASE SCRIPTS
  // ===================================================================

  'chessboard.pitch.first-visit': [
    {
      text: 'The Pitch, lord. You have sixty seconds to seize their attention.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Speak your truth with fire. The Council respects conviction above all.',
      mood: 'speaking',
      duration: 0,
    },
  ],
  'chessboard.pitch.returning': [
    { text: 'The stage is yours again, lord. Make it count.', mood: 'idle', duration: 0 },
  ],

  'chessboard.qa.first-visit': [
    {
      text: 'The Inquisition begins, lord. Each investor will probe your weaknesses.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Answer with precision. Rambling is the mark of an unprepared founder.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The Oracle cannot help you here — only your preparation can.',
      mood: 'whispering',
      duration: 0,
    },
  ],
  'chessboard.qa.returning': [
    { text: 'The Council’s questions resume, lord.', mood: 'idle', duration: 0 },
  ],

  'chessboard.deal.first-visit': [
    {
      text: 'The Offers, lord. The investors have spoken — now choose wisely.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'More capital comes at a price. Guard your equity with care.',
      mood: 'warning',
      duration: 3200,
    },
    {
      text: 'Not every offer is generous. Read between the terms.',
      mood: 'whispering',
      duration: 0,
    },
  ],
  'chessboard.deal.returning': [
    { text: 'The offers remain on the table, lord.', mood: 'idle', duration: 0 },
  ],

  'chessboard.complete.first-visit': [
    {
      text: 'It is done, lord. The Chessboard has spoken.',
      mood: 'celebrating',
      duration: 3000,
    },
    {
      text: 'Proceed to the Verdict Chamber to learn your fate.',
      mood: 'pointing',
      duration: 0,
    },
  ],
  'chessboard.complete.returning': [
    { text: 'The Chessboard is concluded. Onward to the Verdict.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // VERDICT CEREMONY SCRIPTS
  // ===================================================================

  'verdict.first-visit': [
    {
      text: 'The Verdict Chamber, lord. Here, all is revealed.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Each investor will render their judgment. Watch carefully.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'Your performance score will be etched into the Elo Rankings for all to see.',
      mood: 'warning',
      duration: 3400,
    },
    {
      text: 'Whatever the outcome — you dared the gauntlet. That alone is worthy.',
      mood: 'celebrating',
      duration: 0,
    },
  ],
  'verdict.returning': [
    { text: 'Revisiting the verdict, lord? The judgments do not change.', mood: 'idle', duration: 0 },
  ],

  // ===================================================================
  // GREAT HALL — the Advisor's Welcome (progression onboarding).
  // A dedicated phase so it fires once for EVERY founder, including
  // those who saw the older 'dashboard' intro before progression existed.
  // ===================================================================

  'great-hall.first-visit': [
    {
      text: 'Welcome to the Dashboard, lord — your seat of power between trials.',
      mood: 'idle',
      duration: 3400,
    },
    {
      text: 'This is your House: your crest, your words, your name. Forge it as you please.',
      mood: 'pointing',
      highlight: 'dashboard-house',
      duration: 3800,
    },
    {
      text: 'Rating measures your standing. Earn it through sharp decisions and rise from Aspirant to Ruler of the Domain.',
      mood: 'speaking',
      highlight: 'dashboard-rating',
      duration: 4200,
    },
    {
      text: 'These eight stars are your founder competencies. Each brightens as you master it across trials.',
      mood: 'pointing',
      highlight: 'dashboard-constellation',
      duration: 4000,
    },
    {
      text: 'Emblems mark your great deeds — won through merit, never bought.',
      mood: 'speaking',
      duration: 3400,
    },
    {
      text: 'When you are ready, the trial begins beyond that door.',
      mood: 'pointing',
      highlight: 'dashboard-begin-cta',
      duration: 3400,
    },
    {
      text: 'Choose your path, lord.',
      mood: 'idle',
      duration: 0,
    },
  ],

  'great-hall.returning': [
    {
      text: 'The hall is quiet, lord. Your House and your campaigns await.',
      mood: 'idle',
      duration: 2600,
    },
  ],
}

// ===================================================================
// MAPPING HELPERS — translate runtime identifiers to narrator phase keys
// ===================================================================

/** Map StageName (e.g. 'STAGE_NEG2_IDEATION') → narrator phase key (e.g. 'stage.ideation'). */
const STAGE_TO_NARRATOR: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'stage.ideation',
  STAGE_NEG1_VISION: 'stage.vision',
  STAGE_0_COMMITMENT: 'stage.commitment',
  STAGE_1_VALIDATION: 'stage.validation',
  STAGE_2A_GROWTH: 'stage.growth',
  STAGE_2B_EXPANSION: 'stage.expansion',
  STAGE_3_SCALE: 'stage.scale',
  STAGE_WARROOM_PREP: 'stage.chessboard-prep',
}

export function narratorPhaseForStage(stageName: string): string | null {
  return STAGE_TO_NARRATOR[stageName] ?? null
}

/** Map ChessboardPhase → narrator phase key. Returns null for LOADING (too brief). */
const WARROOM_TO_NARRATOR: Record<string, string> = {
  PITCH: 'chessboard.pitch',
  INVESTOR_QA: 'chessboard.qa',
  DEAL_RESULTS: 'chessboard.deal',
  COMPLETE: 'chessboard.complete',
}

export function narratorPhaseForChessboard(phase: string): string | null {
  return WARROOM_TO_NARRATOR[phase] ?? null
}
