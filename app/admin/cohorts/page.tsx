'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import api from '@/src/lib/api'
import type { AdminBatch, CreateBatchRequest } from '@/src/types'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Users,
  Calendar,
  Hash,
  Copy,
  Check,
  Power,
  PowerOff,
  Loader2,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { StoneCard, WarRoomCTA, GoldDivider, SigilBadge } from '@/src/components/primitives'
import { easeDramatic, staggerContainer, staggerItem } from '@/lib/animations/variants'

const INPUT_CLASSES =
  'bg-[color:var(--color-warroom-rampart)]/60 border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)] placeholder:text-[color:var(--color-warroom-smoke)]/50 focus-visible:border-[color:var(--color-warroom-gold)]/60 focus-visible:ring-[color:var(--color-warroom-gold)]/20'

export default function CohortsPage() {
  const prefersReducedMotion = useReducedMotion()
  const [batches, setBatches] = useState<AdminBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Per-batch toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Confirm disable dialog
  const [confirmDisable, setConfirmDisable] = useState<AdminBatch | null>(null)

  // Create form
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState(1)

  const fetchBatches = useCallback(async () => {
    try {
      const data = await api.admin.listBatches()
      setBatches(data)
    } catch (err: unknown) {
      console.error('Failed to fetch batches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setCreateError('Code and name are required')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const req: CreateBatchRequest = {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        level: newLevel,
      }
      await api.admin.createBatch(req)
      setShowCreate(false)
      setNewCode('')
      setNewName('')
      setNewLevel(1)
      fetchBatches()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Called when the Switch is toggled
  async function handleToggle(batch: AdminBatch, newActive: boolean) {
    if (!newActive) {
      setConfirmDisable(batch)
      return
    }
    await doToggle(batch, true)
  }

  async function doToggle(batch: AdminBatch, active: boolean) {
    setTogglingId(batch.id)
    setBatches((prev) =>
      prev.map((b) => (b.id === batch.id ? { ...b, active } : b)),
    )
    try {
      await api.admin.updateBatch(batch.id, { active })
    } catch (err: unknown) {
      console.error('Failed to toggle batch:', err)
      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, active: !active } : b)),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDoDisable() {
    if (!confirmDisable) return
    setConfirmDisable(null)
    await doToggle(confirmDisable, false)
  }

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-warroom-gold)]" />
          <p
            className="text-sm text-[color:var(--color-warroom-smoke)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Loading batches&hellip;
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-[color:var(--color-warroom-gold)]" />
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
                Batch Management
              </h1>
            </div>
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              Create and manage simulation batches
            </p>
          </div>
          <WarRoomCTA size="sm" icon={Plus} onClick={() => setShowCreate(true)}>
            Create Batch
          </WarRoomCTA>
        </div>
        <div className="mt-5">
          <GoldDivider variant="line" />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="show"
      >
        {[
          { label: 'Total Batches', value: batches.length, tone: undefined },
          { label: 'Enabled', value: batches.filter((b) => b.active).length, tone: 'verdant' as const },
          { label: 'Total Participants', value: batches.reduce((sum, b) => sum + b.participantCount, 0), tone: undefined },
          { label: 'Disabled', value: batches.filter((b) => !b.active).length, tone: 'crimson' as const },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <StoneCard>
              <div
                className={`text-2xl font-bold ${stat.tone === 'verdant' ? 'text-[color:var(--color-warroom-verdant)]' : stat.tone === 'crimson' ? 'text-[color:var(--color-warroom-crimson)]' : 'text-[color:var(--color-warroom-ivory)]'}`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.value}
              </div>
              <p
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mt-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.label}
              </p>
            </StoneCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-[color:var(--color-warroom-smoke)]/50" />
        <Input
          placeholder="Search batches by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`pl-10 ${INPUT_CLASSES}`}
        />
      </div>

      {/* Batches Grid */}
      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <StoneCard interactive className={!batch.active ? 'opacity-70' : undefined}>
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base font-semibold text-[color:var(--color-warroom-ivory)] truncate"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {batch.name}
                      </h3>
                      <button
                        onClick={() => handleCopyCode(batch.code)}
                        className="flex items-center gap-1 font-mono text-xs text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] transition-colors mt-1"
                      >
                        <Hash className="h-3 w-3" />
                        {batch.code}
                        {copiedCode === batch.code ? (
                          <Check className="h-3 w-3 text-[color:var(--color-warroom-verdant)]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex-shrink-0">
                      {batch.active ? (
                        <SigilBadge tone="verdant" icon={Power}>
                          Enabled
                        </SigilBadge>
                      ) : (
                        <SigilBadge tone="crimson" icon={PowerOff}>
                          Disabled
                        </SigilBadge>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2 text-[color:var(--color-warroom-smoke)]">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">{batch.participantCount} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-[color:var(--color-warroom-smoke)]">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">{new Date(batch.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p
                    className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-warroom-smoke)] mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Level {batch.level} {batch.level === 1 ? '(Student)' : '(Manager)'}
                  </p>

                  {/* Toggle row */}
                  <div className="flex items-center justify-between pt-3 border-t border-[color:var(--color-warroom-ash)]/20">
                    <div className="flex items-center gap-2">
                      {togglingId === batch.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-warroom-smoke)]" />
                      ) : (
                        <Switch
                          id={`toggle-${batch.id}`}
                          checked={batch.active}
                          onCheckedChange={(checked) => handleToggle(batch, checked)}
                          disabled={togglingId === batch.id}
                          className="data-[state=checked]:bg-[color:var(--color-warroom-verdant)]"
                        />
                      )}
                      <label
                        htmlFor={`toggle-${batch.id}`}
                        className="text-[10px] text-[color:var(--color-warroom-smoke)] cursor-pointer select-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {batch.active ? 'Click to disable' : 'Click to enable'}
                      </label>
                    </div>
                    <Link href={`/admin/cohorts/${batch.id}`}>
                      <WarRoomCTA size="sm" variant="ghost">
                        Details
                      </WarRoomCTA>
                    </Link>
                  </div>
                </StoneCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <StoneCard>
          <div className="text-center py-6">
            <p
              className="text-[color:var(--color-warroom-smoke)] mb-4 text-sm"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              {searchQuery ? 'No batches match your search.' : 'No batches created yet.'}
            </p>
            {!searchQuery && (
              <WarRoomCTA size="sm" onClick={() => setShowCreate(true)}>
                Create First Batch
              </WarRoomCTA>
            )}
          </div>
        </StoneCard>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[color:var(--color-warroom-rampart)] border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)]">
          <DialogHeader>
            <DialogTitle
              className="text-[color:var(--color-warroom-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Create New Batch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createError && (
              <div className="p-3 bg-[color:var(--color-warroom-crimson)]/10 border border-[color:var(--color-warroom-crimson)]/30 text-[color:var(--color-warroom-crimson)] rounded-md text-sm">
                {createError}
              </div>
            )}
            <div>
              <label
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Batch Code
              </label>
              <Input
                placeholder="e.g. SPRING2025A"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className={`mt-1 font-mono ${INPUT_CLASSES}`}
              />
              <p className="text-[10px] text-[color:var(--color-warroom-smoke)] mt-1">
                Participants will use this code to join. Must be unique.
              </p>
            </div>
            <div>
              <label
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Batch Name
              </label>
              <Input
                placeholder="e.g. Spring 2025 Cohort A"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`mt-1 ${INPUT_CLASSES}`}
              />
            </div>
            <div>
              <label
                className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mb-1.5 block"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Level
              </label>
              <div className="flex gap-2 mt-1">
                <WarRoomCTA
                  type="button"
                  size="sm"
                  variant={newLevel === 1 ? 'primary' : 'ghost'}
                  onClick={() => setNewLevel(1)}
                >
                  Level 1 (Student)
                </WarRoomCTA>
                <WarRoomCTA
                  type="button"
                  size="sm"
                  variant={newLevel === 2 ? 'primary' : 'ghost'}
                  onClick={() => setNewLevel(2)}
                >
                  Level 2 (Manager)
                </WarRoomCTA>
              </div>
            </div>
          </div>
          <DialogFooter>
            <WarRoomCTA variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </WarRoomCTA>
            <WarRoomCTA size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating&hellip;
                </>
              ) : (
                'Create Batch'
              )}
            </WarRoomCTA>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Disable Dialog ── */}
      <Dialog open={!!confirmDisable} onOpenChange={(v) => { if (!v) setConfirmDisable(null) }}>
        <DialogContent className="bg-[color:var(--color-warroom-rampart)] border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-ivory)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[color:var(--color-warroom-crimson)]" style={{ fontFamily: 'var(--font-display)' }}>
              <AlertTriangle className="h-5 w-5" />
              Disable Batch?
            </DialogTitle>
            <DialogDescription className="text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
              Disabling <strong className="text-[color:var(--color-warroom-ivory)]">{confirmDisable?.name}</strong> ({confirmDisable?.code}) will prevent all participants
              in this batch from starting new assessments. Existing in-progress simulations will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <WarRoomCTA variant="ghost" size="sm" onClick={() => setConfirmDisable(null)}>
              Cancel
            </WarRoomCTA>
            <WarRoomCTA size="sm" onClick={confirmDoDisable} icon={PowerOff}>
              Disable Batch
            </WarRoomCTA>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
