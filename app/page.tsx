'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, Target, Shield, TrendingUp, Star, Users, BarChart2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FadeInUp, StaggerGrid, AnimatedGradientText, Floating, ScaleOnHover } from '@/src/components/AnimatedComponents'
import { NoiseOverlay } from '@/src/components/effects/NoiseOverlay'
import { RouteBackground } from '@/src/components/effects/RouteBackground'
import {
  ChessboardCTA,
  ChessboardCrest,
  GoldDivider,
  SigilBadge,
  StoneCard,
} from '@/src/components/primitives'
import { audioManager } from '@/lib/audio/audioManager'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { ThemeToggle } from '@/components/theme-toggle'


export default function HomePage() {
  const heroTitleRef = useRef<HTMLHeadingElement>(null)

  useNarratorOnboarding('landing')

  useEffect(() => {
    const t = setTimeout(() => {
      audioManager.playSfx('nav.page-enter', 0.18)
    }, 1200)
    audioManager.setAmbientTrack('ambient.hall')
    return () => clearTimeout(t)
  }, [])

  const pillars = [
    { icon: Shield, name: 'Mentors', desc: 'Strategic advisors who sharpen your thinking and challenge your assumptions', color: '#7c5a9e', sigil: '♟' },
    { icon: TrendingUp, name: 'Investors', desc: 'Evaluators who demand clarity, traction, and conviction in every answer', color: '#c8a84a', sigil: '♜' },
    { icon: Target, name: 'Leaders', desc: 'Operators who test your execution instincts and leadership under pressure', color: '#3d6b8e', sigil: '♞' },
  ]

  const panelists = [
    { name: 'The Financial Strategist', avatar: 'FS', club: 'Capital', color: '#c8a84a' },
    { name: 'The Mindset Architect', avatar: 'MA', club: 'Vision', color: '#7c5a9e' },
    { name: 'The Execution Lead', avatar: 'EL', club: 'Ops', color: '#3d6b8e' },
    { name: 'The Brand Builder', avatar: 'BB', club: 'Growth', color: '#2a2a2a' },
    { name: 'The Market Analyst', avatar: 'MI', club: 'Market', color: '#16a34a' },
    { name: 'The Scale Operator', avatar: 'SO', club: 'Scale', color: '#ea580c' },
  ]

  const stages = [
    {
      num: 1, icon: Users, sigil: '♟',
      title: 'Select Your Panel',
      desc: 'Choose 6 evaluators: 2 mentors, 2 investors, 2 operators. Each brings a distinct perspective.',
      accent: '#7c5a9e', border: 'rgba(124,90,158,0.2)',
    },
    {
      num: 2, icon: MessageSquare, sigil: '♜',
      title: 'Defend Your Strategy',
      desc: 'Navigate 6 rigorous stages. Answer under pressure. Your decisions shape your assessment outcome.',
      accent: '#c8a84a', border: 'rgba(200,168,74,0.2)',
    },
    {
      num: 3, icon: BarChart2, sigil: '♞',
      title: 'Claim Your Verdict',
      desc: 'Receive a verdict from each evaluator. Discover your Founder archetype. Build your roadmap.',
      accent: '#3d6b8e', border: 'rgba(61,107,142,0.2)',
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'transparent' }}>


      {/* NAV */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed w-full z-50 backdrop-blur-md"
        style={{ borderBottom: '1px solid color-mix(in srgb, var(--wr-ash) 10%, transparent)', background: 'color-mix(in srgb, var(--wr-black) 88%, transparent)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="h-9 w-9 rounded-sm flex items-center justify-center font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--wr-black), var(--wr-rampart))',
                  color: 'var(--wr-ivory)',
                  border: '1px solid color-mix(in srgb, var(--wr-ash) 30%, transparent)',
                  boxShadow: '0 0 16px rgba(200,200,200,0.15)',
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontWeight: 800,
                }}
              >
                KK
              </motion.div>
              <div>
                <span className="font-bold text-base" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", color: 'var(--wr-ivory)', letterSpacing: '0.04em' }}>
                  Assessment
                </span>
                <div className="text-[9px] tracking-[0.18em] text-neutral-500 uppercase -mt-0.5">Assessment Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/terms" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors" style={{ letterSpacing: '0.06em' }}>
                Terms
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <ChessboardCTA size="sm" sfxKey="ui.click">
                  Get Started
                </ChessboardCTA>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, color-mix(in srgb, var(--wr-void) 65%, transparent) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--wr-ivory) 30%, transparent), transparent)' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp delay={0.05}>
            <div className="flex justify-center mb-6">
              <ChessboardCrest size={120} />
            </div>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <SigilBadge icon={Target} tone="silver" className="mb-8">
              The Founder Assessment
              <Star className="h-3 w-3 fill-zinc-400 text-zinc-400 ml-1" />
            </SigilBadge>
          </FadeInUp>

          <FadeInUp delay={0.25}>
            <h1 ref={heroTitleRef} className="mb-6" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", fontSize: 'clamp(2.4rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--wr-ivory)' }}>Prove Your Edge to the</span>
              <br />
              <span className="gradient-text-animate" style={{ display: 'inline-block', paddingBottom: '0.1em' }}>
                Expert Panel
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <p className="mt-2 text-base max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--wr-smoke)', letterSpacing: '0.01em' }}>
              Face a panel of seasoned investors, mentors, and operators.
              Your business model is under review. Pitch every detail with precision.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.5}>
            <div className="my-8">
              <GoldDivider variant="line" width="max-w-xs" />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.55}>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <ChessboardCTA
                  size="md"
                  variant="primary"
                  icon={Target}
                  iconRight={ArrowRight}
                  sfxKey="nav.page-enter"
                >
                  Enter the Assessment
                </ChessboardCTA>
              </Link>
              <ChessboardCTA size="md" variant="ghost" sfxKey="ui.hover">
                Watch Demo
              </ChessboardCTA>
            </div>
            <p className="mt-5 text-xs" style={{ color: 'color-mix(in srgb, var(--wr-smoke) 80%, transparent)', letterSpacing: '0.06em' }}>
              By entering, you agree to the{' '}
              <Link href="/terms" className="text-neutral-500 hover:text-neutral-300">Terms &amp; Conditions</Link>
            </p>
          </FadeInUp>

          {/* Panelists */}
          <FadeInUp delay={0.75}>
            <div className="mt-14 flex justify-center items-center gap-1 flex-wrap">
              <span className="text-xs mr-3" style={{ color: 'var(--wr-smoke)', letterSpacing: '0.06em' }}>Your panel:</span>
              {panelists.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.3, y: -6, zIndex: 10 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs -ml-2 first:ml-0 cursor-pointer border-2"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${p.color}60, ${p.color}20)`,
                    borderColor: `${p.color}50`,
                    color: 'var(--wr-ivory)',
                    boxShadow: `0 0 10px ${p.color}30`,
                    fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                    fontSize: '0.6rem',
                  }}
                  title={`${p.name} — ${p.club}`}
                >
                  {p.avatar}
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="text-xs ml-3"
                style={{ color: 'color-mix(in srgb, var(--wr-smoke) 80%, transparent)', letterSpacing: '0.04em' }}
              >
                + 15 Evaluators
              </motion.span>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--wr-black) 30%, transparent), color-mix(in srgb, var(--wr-obsidian) 50%, transparent), color-mix(in srgb, var(--wr-black) 30%, transparent))' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, color-mix(in srgb, var(--wr-ivory) 3%, transparent), transparent 60%)' }} />
        <div className="mx-auto max-w-6xl relative">
          <FadeInUp>
            <div className="text-center mb-16">
              <SigilBadge tone="silver" className="mb-4">The Process</SigilBadge>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", color: 'var(--wr-ivory)', letterSpacing: '-0.02em' }}>
                Three Stages to Your Verdict
              </h2>
              <p style={{ color: 'var(--wr-smoke)', fontSize: '0.9rem', letterSpacing: '0.01em' }}>
                Not a quiz. A rigorous evaluation. Designed to reveal your true founder profile.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.15}>
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <ScaleOnHover key={stage.num}>
                  <StoneCard
                    interactive
                    accent={stage.accent}
                    sigilWatermark={stage.sigil}
                    className="group"
                    style={{ background: 'linear-gradient(160deg, rgba(18,18,18,0.95) 0%, rgba(12,12,12,0.98) 100%)' }}
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-sm font-bold text-base shrink-0"
                        style={{
                          background: stage.accent,
                          color: stage.num === 2 ? '#000000' : '#FFFFFF',
                          fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                          boxShadow: `0 0 18px ${stage.accent}44, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        }}
                      >
                        {stage.num}
                      </div>
                      <Icon className="h-5 w-5" style={{ color: stage.accent, opacity: 1 }} aria-hidden />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-[#F4F4F5]" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", letterSpacing: '-0.01em' }}>
                      {stage.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#A1A1AA]">
                      {stage.desc}
                    </p>
                  </StoneCard>
                </ScaleOnHover>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* PILLARS */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: '#080808' }}>
        <NoiseOverlay opacity={0.03} />
        <div className="mx-auto max-w-6xl relative z-10">
          <FadeInUp>
            <div className="text-center mb-16">
              <SigilBadge tone="gold" className="mb-4">The Panel</SigilBadge>
              <h2 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", letterSpacing: '-0.02em' }}>
                Three Perspectives. One Verdict.
              </h2>
              <p className="text-zinc-400" style={{ fontSize: '0.9rem' }}>
                Their priorities will conflict. Your judgment determines the outcome.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-3" stagger={0.1}>
            {pillars.map((h) => {
              const Icon = h.icon
              return (
                <StoneCard key={h.name} interactive accent={h.color} sigilWatermark={h.sigil} padding="lg">
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-sm flex items-center justify-center mb-4"
                    style={{ background: `${h.color}12`, border: `1px solid ${h.color}28` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: h.color }} aria-hidden />
                  </motion.div>
                  <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", color: 'var(--wr-ivory)', letterSpacing: '-0.01em' }}>{h.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--wr-smoke)', letterSpacing: '0.01em' }}>{h.desc}</p>
                </StoneCard>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* THE CHALLENGE */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(200,168,74,0.04), rgba(60,60,60,0.04), rgba(200,168,74,0.04))' }} />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp>
            <Floating duration={4} y={6}>
              <div className="mb-4 flex justify-center text-5xl opacity-60">♛</div>
            </Floating>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <h2 className="text-3xl font-bold mb-4 text-zinc-950 dark:text-zinc-100" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
              Conflicting Priorities. One Decision.
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <p className="text-base mb-6 text-zinc-800 dark:text-zinc-400" style={{ maxWidth: '36rem', margin: '0 auto 2rem', lineHeight: 1.8 }}>
              The Financial Strategist demands unit economics above all. The Brand Builder insists culture drives retention.
              The Scale Operator warns against premature growth. The Market Analyst sees a closing window.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.3}>
            <p className="text-base font-semibold" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", letterSpacing: '0.02em' }}>
              <AnimatedGradientText from="#c8a84a" via="#e0e0e0" to="#c8a84a">
                Real founders navigate conflicting counsel every day. Prove you can.
              </AnimatedGradientText>
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(200,168,74,0.02), transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,74,0.25), transparent)' }} />
        </div>
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <FadeInUp>
            <div className="mb-4 flex justify-center text-4xl text-zinc-100">♔</div>
            <h2 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", letterSpacing: '-0.02em' }}>
              Ready for Your Assessment?
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-base mb-10 max-w-lg mx-auto text-zinc-400" style={{ letterSpacing: '0.01em' }}>
              Two attempts. Six stages. One verdict. Your roadmap starts here.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <Link href="/dashboard">
              <ChessboardCTA size="lg" variant="primary" icon={Target} iconRight={ArrowRight} sfxKey="wr.door-creak">
                Enter the Assessment
              </ChessboardCTA>
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 sm:px-6 lg:px-8 text-center bg-black" style={{ borderTop: '1px solid rgba(200,168,74,0.15)' }}>
        <div className="text-3xl mb-3 text-zinc-700">♟</div>
        <p className="text-xs text-zinc-400" style={{ letterSpacing: '0.08em', fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
          © 2026 KK&apos;s Assessment — All Rights Reserved
        </p>
        <p className="mt-1 text-xs text-zinc-500" style={{ letterSpacing: '0.04em' }}>
          Precision under pressure. Powered by AI.
        </p>
      </footer>
    </div>
  )
}
