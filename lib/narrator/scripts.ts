import type { NarratorLine } from '@/src/state/narratorStore'

/**
 * NARRATOR_SCRIPTS — pre-authored dialogue lines keyed by phase.
 *
 * This file is intentionally append-only. Each slice adds the lines
 * it needs without rewriting existing entries. The landing slice
 * populates only the two `landing.*` keys; future slices populate
 * `stage.*`, `warroom.*`, `verdict.*`, etc.
 */

export const NARRATOR_SCRIPTS: Record<string, NarratorLine[]> = {
  'landing.first-visit': [
    {
      text: 'Welcome, seeker. I am the Oracle of the War Room.',
      mood: 'idle',
      duration: 3200,
    },
    {
      text: 'Before you stands the greatest trial a founder can face.',
      mood: 'speaking',
      duration: 3600,
    },
    {
      text: 'Six stages await. Then... the War Room.',
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
      text: 'Welcome to the Great Hall. This is your council chamber between trials.',
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
      text: 'The Iron Rankings track every founder who has dared the gauntlet.',
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
      text: 'Nine stages await — from first spark of Ideation to the War Room itself.',
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
      text: 'The Iron Rankings, lord. Here, all founders are measured by the coin they command.',
      mood: 'idle',
      duration: 3600,
    },
    {
      text: 'Your projected revenue determines your standing among the realm.',
      mood: 'speaking',
      duration: 3200,
    },
    {
      text: 'The throne awaits the boldest.',
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
      text: 'The Legacy Scroll, lord. Every campaign you have fought is recorded here.',
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
      text: 'Shape the War Room to your liking — but the trials remain the same.',
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
      text: 'If the War Room confounds you, seek counsel here.',
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
}
