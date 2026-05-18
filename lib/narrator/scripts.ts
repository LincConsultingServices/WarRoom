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
}
