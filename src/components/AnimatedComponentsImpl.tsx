'use client'

// ============================================
// AnimatedComponentsImpl — Thin re-export barrel.
//
// Canonical implementations now live in src/components/animated/:
//   motion-wrappers.tsx — FadeInUp, StaggerGrid, ScaleOnHover, Floating, SlideTransition
//   text-effects.tsx   — CountUp, TypewriterText, AnimatedGradientText
//   visual-primitives.tsx — GlowCard, PulseGlow, Shimmer
//   stage-overlays.tsx — CinemaOverlay, StageNarrationOverlay, SnapshotDashboard, MentorTipPopup
//
// This file exists solely so existing imports from
// '@/src/components/AnimatedComponentsImpl' keep working.
// ============================================

export {
  FadeInUp,
  StaggerGrid,
  ScaleOnHover,
  Floating,
  SlideTransition,
  CountUp,
  TypewriterText,
  AnimatedGradientText,
  GlowCard,
  PulseGlow,
  Shimmer,
  CinemaOverlay,
  StageNarrationOverlay,
  SnapshotDashboard,
  MentorTipPopup,
} from './animated'
