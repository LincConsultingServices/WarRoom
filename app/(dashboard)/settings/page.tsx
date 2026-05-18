'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Bell,
  Shield,
  Palette,
  Zap,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
} from '@/src/components/primitives'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { easeDramatic } from '@/lib/animations/variants'

// ─── Constants ──────────────────────────────────────────────────────────────

const INPUT_CLASSES =
  'bg-[color:var(--color-warroom-rampart)]/60 border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)]/50 focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20'

type TabKey = 'profile' | 'notifications' | 'appearance' | 'privacy'

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'privacy', label: 'Privacy', icon: Shield },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const prefersReducedMotion = useReducedMotion()

  // Placeholder session
  const session = { user: { name: 'User', email: 'user@example.com' } }

  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  useNarratorOnboarding('settings', { delayMs: 1200 })

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: 'Settings saved',
      description: 'Your profile has been updated successfully.',
    })
    setIsSaving(false)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: 'Preferences saved',
      description: 'Your notification settings have been updated.',
    })
    setIsSaving(false)
  }

  return (
    <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 w-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Settings
            className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
            aria-hidden
          />
          <h1
            className="text-xl font-semibold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Forge
          </h1>
        </div>
        <p
          className="text-sm text-[color:var(--color-warroom-smoke)] mb-4"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Manage your account settings and preferences.
        </p>
        <GoldDivider variant="line" />
      </motion.div>

      {/* ── Tab navigation ── */}
      <motion.div
        className="mb-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeDramatic }}
      >
        <div className="flex flex-wrap gap-1 p-1 rounded-[4px] bg-[color:var(--color-warroom-rampart)]/60 border border-[color:var(--color-warroom-ash)]/25 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.14em] rounded-[3px] transition-all',
                  activeTab === tab.key
                    ? 'bg-[color:var(--color-warroom-gold)]/[0.12] text-[color:var(--color-warroom-gold)] border border-[color:var(--color-warroom-gold)]/30'
                    : 'text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-ivory)] border border-transparent',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {/* ═══ Profile ═══ */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
            className="space-y-6"
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Profile Information
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Update your personal information and contact details.
                </p>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={session?.user?.name || ''}
                      placeholder="Your name"
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      placeholder="your@email.com"
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="organization"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Organization
                  </Label>
                  <Input
                    id="organization"
                    name="organization"
                    placeholder="Your company or institution"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Role
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    placeholder="e.g., Entrepreneur, Student, Educator"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="pt-2 border-t border-[color:var(--color-warroom-ash)]/20">
                  <WarRoomCTA type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? 'Forging Changes…' : 'Save Changes'}
                  </WarRoomCTA>
                </div>
              </form>
            </StoneCard>

            {/* Danger zone */}
            <StoneCard accent="var(--color-warroom-crimson)" padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-crimson)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-crimson-bright)] tracking-[0.04em] flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Irreversible actions that affect your account.
                </p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-semibold text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Delete all simulation data
                  </p>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    This will permanently delete all your simulations and
                    results.
                  </p>
                </div>
                <WarRoomCTA size="sm" variant="ghost">
                  Delete Data
                </WarRoomCTA>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Notifications ═══ */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Email Notifications
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Choose what messages the ravens deliver.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                {[
                  {
                    id: 'email-simulation',
                    label: 'Simulation Updates',
                    desc: 'Notifications about your ongoing simulations',
                    defaultOn: true,
                  },
                  {
                    id: 'email-results',
                    label: 'Results Available',
                    desc: 'When your simulation results are ready',
                    defaultOn: true,
                  },
                  {
                    id: 'email-tips',
                    label: 'Tips & Insights',
                    desc: 'Weekly tips to improve your entrepreneurial skills',
                    defaultOn: false,
                  },
                  {
                    id: 'email-updates',
                    label: 'Product Updates',
                    desc: 'News about new features and improvements',
                    defaultOn: false,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={item.id}
                        className="text-sm text-[color:var(--color-warroom-ivory)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.label}
                      </Label>
                      <p
                        className="text-xs text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-body, serif)' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    <Switch id={item.id} defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-[color:var(--color-warroom-ash)]/20">
                <WarRoomCTA
                  size="sm"
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                >
                  {isSaving ? 'Sending Ravens…' : 'Save Preferences'}
                </WarRoomCTA>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Appearance ═══ */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Theme & Effects
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Customize the appearance of the War Room.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                <div className="pb-4">
                  <Label
                    className="text-sm text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Color Mode
                  </Label>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-1 mb-3"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    The War Room is forged in darkness. Theme control is
                    available in the sidebar.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-warroom-smoke)]">
                    <Palette className="h-3.5 w-3.5 text-[color:var(--color-warroom-gold)]" />
                    <span style={{ fontFamily: 'var(--font-display)' }}>
                      Theme toggle available in sidebar
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="animations"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Animations
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Enable or disable interface animations
                    </p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="typewriter"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Typewriter Effects
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Show typewriter animation in Oracle narratives
                    </p>
                  </div>
                  <Switch id="typewriter" defaultChecked />
                </div>
              </div>
            </StoneCard>
          </motion.div>
        )}

        {/* ═══ Privacy ═══ */}
        {activeTab === 'privacy' && (
          <motion.div
            key="privacy"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-sm font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Data & Privacy
                </h2>
                <p
                  className="text-xs text-[color:var(--color-warroom-smoke)] mt-0.5"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Control how your data is used and shared.
                </p>
              </div>
              <div className="p-6 space-y-0 divide-y divide-[color:var(--color-warroom-ash)]/15">
                <div className="flex items-center justify-between pb-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="analytics"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Usage Analytics
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Help improve War Room by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="profile-public"
                      className="text-sm text-[color:var(--color-warroom-ivory)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Public Profile
                    </Label>
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-body, serif)' }}
                    >
                      Make your profile visible on the Iron Rankings
                    </p>
                  </div>
                  <Switch id="profile-public" />
                </div>

                <div className="pt-4">
                  <Label
                    className="text-sm text-[color:var(--color-warroom-ivory)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Data Export
                  </Label>
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)] mt-1 mb-3"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    Download a copy of your simulation data and results.
                  </p>
                  <WarRoomCTA size="sm" variant="ghost" icon={Zap}>
                    Export My Data
                  </WarRoomCTA>
                </div>
              </div>
            </StoneCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
