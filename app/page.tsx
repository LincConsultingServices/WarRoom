'use client'

import Link from 'next/link'
import { useEffect, useRef, useMemo } from 'react'
import { ArrowRight, Sword, Shield, Crown, Flame, Star, Users, Target, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeInUp, GlowCard, StaggerGrid, AnimatedGradientText, Floating, ScaleOnHover } from '@/src/components/AnimatedComponents'
import { playGOTSound } from '@/src/components/GOTSoundManager'

const EMBER_COUNT = 18

// Stable ember positions (no Math.random in render — avoids hydration mismatch)
const EMBER_POSITIONS = [
  { left: 5, dur: 3.2, delay: 0.1, dx: 8 }, { left: 12, dur: 4.1, delay: 0.8, dx: -12 },
  { left: 20, dur: 3.8, delay: 1.5, dx: 6 }, { left: 28, dur: 5.0, delay: 0.3, dx: -8 },
  { left: 35, dur: 3.5, delay: 2.1, dx: 14 }, { left: 42, dur: 4.4, delay: 0.6, dx: -6 },
  { left: 50, dur: 3.1, delay: 1.2, dx: 10 }, { left: 58, dur: 4.8, delay: 1.9, dx: -16 },
  { left: 65, dur: 3.7, delay: 0.4, dx: 5 }, { left: 72, dur: 5.2, delay: 2.4, dx: -10 },
  { left: 80, dur: 3.3, delay: 0.9, dx: 12 }, { left: 88, dur: 4.6, delay: 1.6, dx: -5 },
  { left: 92, dur: 3.9, delay: 0.2, dx: 8 }, { left: 15, dur: 4.2, delay: 3.0, dx: -14 },
  { left: 45, dur: 3.6, delay: 2.7, dx: 6 }, { left: 70, dur: 4.9, delay: 3.5, dx: -9 },
  { left: 25, dur: 3.4, delay: 1.8, dx: 11 }, { left: 60, dur: 5.1, delay: 2.9, dx: -7 },
]

function EmberParticle({ left, dur, delay, dx }: { left: number; dur: number; delay: number; dx: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute w-1 h-1 rounded-full"
      style={{
        left: `${left}%`,
        bottom: '0',
        background: `radial-gradient(circle, #ff6b00, #c9a227)`,
        boxShadow: '0 0 4px #ff6b00',
      }}
      animate={{
        y: [0, -120 - dur * 20],
        x: [0, dx],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0],
      }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

export default function HomePage() {
  const heroTitleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Horn sound on load (quiet)
    const t = setTimeout(() => {
      try { playGOTSound('horn_battle', 0.15) } catch {}
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  const houses = [
    { icon: Crown, name: 'Mentors', desc: 'Master strategists who forge your mindset on the field of ideas', color: '#a855f7', sigil: '⚜' },
    { icon: Flame, name: 'Investors', desc: 'Dragons who demand gold and execution — or they burn your plan', color: '#c9a227', sigil: '🐉' },
    { icon: Shield, name: 'Leaders', desc: 'Lords who push purpose and honor above all else', color: '#3b82f6', sigil: '🛡' },
  ]

  const panelists = [
    { name: 'The Master of Coin', avatar: 'MC', house: 'Lannister', color: '#c9a227' },
    { name: 'The Mindset Architect', avatar: 'MA', house: 'Targaryen', color: '#8b1a1a' },
    { name: 'The Hand of Execution', avatar: 'HE', house: 'Stark', color: '#3b82f6' },
    { name: 'The Purpose Translator', avatar: 'PT', house: 'Baratheon', color: '#1a1a1a' },
    { name: 'The Mother of Instinct', avatar: 'MI', house: 'Tyrell', color: '#16a34a' },
    { name: 'The Institution Builder', avatar: 'IB', house: 'Martell', color: '#ea580c' },
  ]

  const stages = [
    {
      num: 1, icon: Users, sigil: '⚔',
      title: 'Assemble Your Council',
      desc: 'Choose 6 advisors: 2 mentors, 2 investors, 2 leaders. Each brings a different agenda.',
      accent: '#a855f7', border: 'rgba(168,85,247,0.2)',
    },
    {
      num: 2, icon: MessageSquare, sigil: '🐉',
      title: 'Defend Your Realm',
      desc: 'Navigate 6 brutal stages. Answer under fire. Your decisions shape your kingdom\'s fate.',
      accent: '#c9a227', border: 'rgba(201,162,39,0.2)',
    },
    {
      num: 3, icon: Target, sigil: '👑',
      title: 'Claim the Throne',
      desc: 'Receive verdict from each lord. Discover your Founder archetype. Forge your legacy.',
      accent: '#ef4444', border: 'rgba(239,68,68,0.2)',
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0806 0%, #110e0a 40%, #0d0b09 100%)' }}>

      {/* NAV */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed w-full z-50 backdrop-blur-md"
        style={{ borderBottom: '1px solid rgba(201,162,39,0.12)', background: 'rgba(10,8,6,0.85)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="h-9 w-9 rounded-sm flex items-center justify-center font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #8b6914, #c9a227, #8b6914)',
                  color: '#0a0806',
                  boxShadow: '0 0 20px rgba(201,162,39,0.3)',
                  fontFamily: "'Cinzel', Georgia, serif",
                }}
              >
                KK
              </motion.div>
              <div>
                <span className="font-bold text-base" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#c9a227', letterSpacing: '0.08em' }}>
                  War Room
                </span>
                <div className="text-[9px] tracking-[0.2em] text-amber-700/60 uppercase -mt-0.5">Forge Your Legacy</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="text-xs text-amber-800/60 hover:text-amber-600 transition-colors" style={{ letterSpacing: '0.06em' }}>
                Oath &amp; Terms
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs border-amber-900/40 text-amber-700 hover:border-amber-600/50 hover:text-amber-500">
                  Enter
                </Button>
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { try { playGOTSound('sword_clash', 0.3) } catch {} }}
                  className="px-4 py-2 text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #b8891e, #c9a227)',
                    color: '#0a0806',
                    border: '1px solid rgba(201,162,39,0.4)',
                    borderRadius: '3px',
                    fontFamily: "'Cinzel', Georgia, serif",
                    letterSpacing: '0.06em',
                    boxShadow: '0 2px 12px rgba(201,162,39,0.25)',
                  }}
                >
                  Claim Seat
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pt-40 pb-28 sm:px-6 lg:px-8 min-h-screen flex items-center">
        {/* Fire ambiance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-1/3">
            {EMBER_POSITIONS.map((p, i) => (
              <EmberParticle key={i} left={p.left} dur={p.dur} delay={p.delay} dx={p.dx} />
            ))}
          </div>
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
          {/* Side torches glow */}
          <div className="absolute top-1/3 left-0 w-64 h-64 opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #ff6b00, transparent)' }} />
          <div className="absolute top-1/3 right-0 w-64 h-64 opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #ff6b00, transparent)' }} />
          {/* Gold horizon */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent)' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp delay={0.1}>
            <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-xs font-bold tracking-widest uppercase"
              style={{
                color: '#c9a227',
                border: '1px solid rgba(201,162,39,0.3)',
                background: 'rgba(201,162,39,0.06)',
                borderRadius: '2px',
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: '0.18em',
              }}>
              <Flame className="h-3.5 w-3.5 animate-torch-glow" />
              The Ultimate Founder Trial
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.25}>
            <h1 ref={heroTitleRef} className="mb-6" style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 'clamp(2.4rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '0.03em' }}>
              <span style={{ color: '#e8e0d0', textShadow: '0 0 40px rgba(201,162,39,0.15)' }}>Pitch to the</span>
              <br />
              <span className="gradient-text-animate" style={{ display: 'inline-block', paddingBottom: '0.1em' }}>
                Council of Lords
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <p className="mt-2 text-base max-w-xl mx-auto leading-relaxed" style={{ color: '#8c8075', letterSpacing: '0.02em' }}>
              Face a war council of legendary investors, mentors, and visionary leaders.
              Your startup idea is the kingdom. Defend it with everything you have.
            </p>
          </FadeInUp>

          {/* Decorative divider */}
          <FadeInUp delay={0.5}>
            <div className="my-8 flex items-center gap-4 max-w-xs mx-auto">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.3))' }} />
              <span style={{ color: 'rgba(201,162,39,0.5)', fontSize: '0.9rem' }}>⚔</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,162,39,0.3), transparent)' }} />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.55}>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { try { playGOTSound('horn_battle', 0.4) } catch {} }}
                  className="group px-8 py-4 w-full sm:w-auto relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #b8891e, #c9a227, #e8c84a, #b8891e)',
                    backgroundSize: '200% 100%',
                    color: '#0a0806',
                    border: '1px solid rgba(201,162,39,0.6)',
                    borderRadius: '3px',
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 24px rgba(201,162,39,0.35), inset 0 1px 0 rgba(255,230,120,0.3)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span className="flex items-center gap-2 justify-center">
                    <Sword className="h-4 w-4" />
                    Enter the War Room
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 text-sm"
                style={{
                  background: 'rgba(201,162,39,0.06)',
                  border: '1px solid rgba(201,162,39,0.2)',
                  color: '#c9a227',
                  borderRadius: '3px',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Watch the Trial
              </motion.button>
            </div>
            <p className="mt-5 text-xs" style={{ color: 'rgba(140,128,117,0.6)', letterSpacing: '0.06em' }}>
              By entering, you swear to the{' '}
              <Link href="/terms" className="text-amber-700 hover:text-amber-500">Oath &amp; Terms</Link>
            </p>
          </FadeInUp>

          {/* Panelists orbital */}
          <FadeInUp delay={0.75}>
            <div className="mt-14 flex justify-center items-center gap-1 flex-wrap">
              <span className="text-xs mr-3" style={{ color: 'rgba(140,128,117,0.6)', letterSpacing: '0.06em' }}>Face the council:</span>
              {panelists.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.3, y: -6, zIndex: 10 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs -ml-2 first:ml-0 cursor-pointer border-2"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${p.color}80, ${p.color}30)`,
                    borderColor: `${p.color}60`,
                    color: '#f5e6c8',
                    boxShadow: `0 0 12px ${p.color}40`,
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '0.6rem',
                  }}
                  title={`${p.name} — House ${p.house}`}
                >
                  {p.avatar}
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="text-xs ml-3"
                style={{ color: 'rgba(140,128,117,0.5)', letterSpacing: '0.04em' }}
              >
                + 15 Lords
              </motion.span>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(180deg, #0d0b09, #110e0a, #0d0b09)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, rgba(201,162,39,0.04), transparent 60%)' }} />
        <div className="mx-auto max-w-6xl relative">
          <FadeInUp>
            <div className="text-center mb-16">
              <div className="got-house-badge mx-auto mb-4 w-fit">The Trial</div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
                Three Trials to the Throne
              </h2>
              <p style={{ color: '#8c8075', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                Not a simulation. A reckoning. Built to break you—and make you stronger.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.15}>
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <ScaleOnHover key={stage.num}>
                  <div className="relative p-7 got-stone-card transition-all duration-300 group">
                    <div className="absolute -top-4 left-6 w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm"
                      style={{
                        background: stage.accent,
                        color: '#0a0806',
                        fontFamily: "'Cinzel', Georgia, serif",
                        boxShadow: `0 0 16px ${stage.accent}60`,
                      }}>
                      {stage.num}
                    </div>
                    <div className="mb-4 mt-2 text-3xl">{stage.sigil}</div>
                    <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
                      {stage.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#8c8075' }}>{stage.desc}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(90deg, transparent, ${stage.accent}60, transparent)` }} />
                  </div>
                </ScaleOnHover>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* HOUSES */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative" style={{ background: '#0a0806' }}>
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <div className="text-center mb-16">
              <div className="got-house-badge mx-auto mb-4 w-fit">The Council</div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
                The Great Houses of the War Room
              </h2>
              <p style={{ color: '#8c8075', fontSize: '0.9rem' }}>
                Their counsel will conflict. Your wisdom decides the realm's fate.
              </p>
            </div>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-3" stagger={0.1}>
            {houses.map((h) => {
              const Icon = h.icon
              return (
                <GlowCard key={h.name} glowColor={`${h.color}20`} className="p-8"
                  style={{ background: 'rgba(17,14,10,0.8)', border: `1px solid rgba(${h.name === 'Investors' ? '201,162,39' : h.name === 'Leaders' ? '59,130,246' : '168,85,247'},0.15)` }}>
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-sm flex items-center justify-center mb-4 text-2xl"
                    style={{ background: `${h.color}15`, border: `1px solid ${h.color}30` }}
                  >
                    {h.sigil}
                  </motion.div>
                  <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>{h.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8c8075' }}>{h.desc}</p>
                </GlowCard>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* THE TWIST */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(139,26,26,0.08), rgba(201,162,39,0.06), rgba(139,26,26,0.08))' }} />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <FadeInUp>
            <Floating duration={4} y={6}>
              <div className="text-5xl mb-4 animate-torch-glow">🐉</div>
            </Floating>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
              <AnimatedGradientText from="#c9a227" via="#ff6b00" to="#8b1a1a">
                Conflicting Counsel. One Throne.
              </AnimatedGradientText>
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <p className="text-base mb-6" style={{ color: '#8c8075', maxWidth: '36rem', margin: '0 auto 2rem', lineHeight: 1.8 }}>
              The Master of Coin demands profit above honor. The Brand Pioneer preaches culture first.
              The Sales Commander screams ten-times growth. The Acquisition Operator warns of the debt dragon.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.3}>
            <p className="text-base font-semibold" style={{ fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.06em' }}>
              <AnimatedGradientText from="#c9a227" via="#e8c84a" to="#c9a227">
                Real founders navigate conflicting counsel every day. Prove you can.
              </AnimatedGradientText>
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #110e0a, #1a1208, #110e0a)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(201,162,39,0.06), transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)' }} />
        </div>
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <FadeInUp>
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.04em' }}>
              Ready to Face the Council?
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="mb-10 text-sm" style={{ color: '#8c8075', letterSpacing: '0.04em' }}>
              Two attempts. Six trials. One verdict. The throne awaits the worthy.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { try { playGOTSound('horn_battle', 0.5) } catch {} }}
                className="group px-10 py-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #8b6914, #c9a227, #e8c84a, #c9a227, #8b6914)',
                  backgroundSize: '200% 100%',
                  color: '#0a0806',
                  border: '1px solid rgba(201,162,39,0.7)',
                  borderRadius: '3px',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 32px rgba(201,162,39,0.4), inset 0 1px 0 rgba(255,230,120,0.4)',
                }}
              >
                <span className="flex items-center gap-3 justify-center">
                  <Sword className="h-5 w-5" />
                  Enter the War Room
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-10 sm:px-6 lg:px-8 text-center" style={{ borderTop: '1px solid rgba(201,162,39,0.1)', background: '#080604' }}>
        <div className="text-3xl mb-3 opacity-30">⚔</div>
        <p className="text-xs" style={{ color: 'rgba(140,128,117,0.4)', letterSpacing: '0.08em', fontFamily: "'Cinzel', Georgia, serif" }}>
          © 2026 KK&apos;s War Room — All Rights Reserved
        </p>
        <p className="mt-1 text-xs" style={{ color: 'rgba(140,128,117,0.25)', letterSpacing: '0.04em' }}>
          Winter is Coming for Unprepared Founders. Powered by AI.
        </p>
      </footer>
    </div>
  )
}
