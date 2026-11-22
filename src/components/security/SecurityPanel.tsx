'use client'

// ============================================
// SecurityPanel — account security controls shared by participant Settings and
// the admin Security page:
//
//   • Email verification (a Firebase prerequisite for two-factor auth)
//   • Two-factor authentication with an authenticator app (TOTP)
//   • Password change
//
// Sensitive operations need a recent sign-in. When Firebase answers
// auth/requires-recent-login, a re-auth dialog asks for the password (and the
// 2FA code when enrolled), then the original action is retried automatically.
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  updatePassword,
  type MultiFactorInfo,
  type MultiFactorResolver,
  type TotpSecret,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { authErrorMessage } from '@/src/lib/firebase'
import {
  enrolledFactors,
  finishTotpEnrollment,
  hasTotp,
  MfaChallenge,
  needsRecentLogin,
  reauthenticateWithPassword,
  resolveWithTotp,
  sendVerificationEmail,
  startTotpEnrollment,
  totpQrUri,
  unenrollFactor,
} from '@/src/lib/mfa'
import { StoneCard, ChessboardCTA } from '@/src/components/primitives'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const INPUT_CLASSES =
  'bg-[color:var(--color-chessboard-rampart)]/60 border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-ivory)] placeholder:text-[color:var(--color-chessboard-smoke)] focus-visible:border-[color:var(--color-chessboard-gold)]/60 focus-visible:ring-[color:var(--color-chessboard-gold)]/20'

const display = { fontFamily: 'var(--font-display)' } as const
const body = { fontFamily: 'var(--font-body, serif)' } as const

// ─── Small building blocks ──────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-6 py-4 border-b border-[color:var(--color-chessboard-ash)]/20">
      <h2 className="text-sm font-semibold text-[color:var(--color-chessboard-ivory)] tracking-[0.04em]" style={display}>
        {title}
      </h2>
      <p className="text-xs text-[color:var(--color-chessboard-smoke)] mt-0.5" style={body}>
        {subtitle}
      </p>
    </div>
  )
}

function StatusPill({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]',
        ok
          ? 'border-[color:var(--color-chessboard-verdant)]/40 text-[color:var(--color-chessboard-verdant)] bg-[color:var(--color-chessboard-verdant)]/[0.08]'
          : 'border-[color:var(--color-chessboard-ember)]/40 text-[color:var(--color-chessboard-ember)] bg-[color:var(--color-chessboard-ember)]/[0.08]',
      )}
      style={display}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {ok ? okText : badText}
    </span>
  )
}

function CodeInput({
  value,
  onChange,
  onComplete,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  autoFocus?: boolean
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={(v) => onChange(v.replace(/[^0-9]/g, ''))}
      onComplete={onComplete}
      autoFocus={autoFocus}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label="6-digit authentication code"
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className="h-11 w-10 border-[color:var(--color-chessboard-ash)]/40 text-[color:var(--color-chessboard-ivory)] text-lg"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

// ─── Panel ──────────────────────────────────────────────────────────────────

type PendingAction = () => Promise<void>

export function SecurityPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const { firebaseUser, profile, logout, loading: authLoading } = useAuth()

  // Bumped after any change so derived Firebase state (enrolledFactors,
  // emailVerified) re-renders — those live on the mutable User object.
  const [, setVersion] = useState(0)
  const rerender = () => setVersion((v) => v + 1)

  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  // TOTP enrolment
  const [secret, setSecret] = useState<TotpSecret | null>(null)
  const [enrollCode, setEnrollCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Re-auth dialog
  const [reauthOpen, setReauthOpen] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [reauthResolver, setReauthResolver] = useState<MultiFactorResolver | null>(null)
  const [reauthCode, setReauthCode] = useState('')
  const [reauthError, setReauthError] = useState('')
  const pendingAction = useRef<PendingAction | null>(null)

  const user = firebaseUser
  const emailVerified = Boolean(user?.emailVerified)
  const factors: MultiFactorInfo[] = user ? enrolledFactors(user) : []
  const totpOn = user ? hasTotp(user) : false
  const isPasswordAccount = Boolean(user?.providerData.some((p) => p.providerId === 'password'))

  // Refresh emailVerified when the tab regains focus (user clicked the link in
  // another tab).
  useEffect(() => {
    if (!user || user.emailVerified) return
    const onFocus = () => {
      user
        .reload()
        .then(() => rerender())
        .catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  /** Session got revoked (e.g. after removing a factor) — send to sign-in. */
  const handleSessionEnded = useCallback(async () => {
    toast({
      title: 'Please sign in again',
      description: 'Your security settings changed, so your session was refreshed.',
    })
    await logout()
    router.push('/login')
  }, [logout, router, toast])

  /**
   * Runs a sensitive action; if Firebase demands a recent sign-in, opens the
   * re-auth dialog and retries the action once re-auth succeeds.
   */
  const runSensitive = useCallback(
    async (key: string, action: PendingAction) => {
      setBusy(key)
      setError('')
      try {
        await action()
      } catch (err) {
        if (needsRecentLogin(err)) {
          pendingAction.current = action
          setReauthPassword('')
          setReauthResolver(null)
          setReauthCode('')
          setReauthError('')
          setReauthOpen(true)
        } else if (err instanceof FirebaseError && err.code === 'auth/user-token-expired') {
          await handleSessionEnded()
        } else {
          setError(authErrorMessage(err))
        }
      } finally {
        setBusy(null)
      }
    },
    [handleSessionEnded],
  )

  const finishReauth = async () => {
    setReauthOpen(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (action) await runSensitive('retry', action)
  }

  const submitReauthPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy('reauth')
    setReauthError('')
    try {
      await reauthenticateWithPassword(user, reauthPassword)
      await finishReauth()
    } catch (err) {
      if (err instanceof MfaChallenge) {
        setReauthResolver(err.resolver)
      } else {
        setReauthError(authErrorMessage(err))
      }
    } finally {
      setBusy(null)
    }
  }

  const submitReauthCode = async (code: string) => {
    if (!reauthResolver || code.length !== 6) return
    setBusy('reauth')
    setReauthError('')
    try {
      await resolveWithTotp(reauthResolver, code)
      await finishReauth()
    } catch (err) {
      setReauthError(authErrorMessage(err))
      setReauthCode('')
    } finally {
      setBusy(null)
    }
  }

  // ── Email verification ──
  const resendVerification = () =>
    runSensitive('verify', async () => {
      if (!user) return
      await sendVerificationEmail(user)
      toast({ title: 'Verification email sent', description: `Check ${user.email} for the link.` })
    })

  const recheckVerification = () =>
    runSensitive('recheck', async () => {
      if (!user) return
      await user.reload()
      await user.getIdToken(true)
      rerender()
      toast({
        title: user.emailVerified ? 'Email verified' : 'Not verified yet',
        description: user.emailVerified
          ? 'You can now turn on two-factor authentication.'
          : 'Open the link in the email we sent, then check again.',
      })
    })

  // ── TOTP enrolment ──
  const beginEnrollment = () =>
    runSensitive('enroll-start', async () => {
      if (!user) return
      const s = await startTotpEnrollment(user)
      setSecret(s)
      setEnrollCode('')
      setCopied(false)
    })

  const confirmEnrollment = (code: string) => {
    if (!user || !secret || code.length !== 6) return
    return runSensitive('enroll-finish', async () => {
      try {
        await finishTotpEnrollment(user, secret, code)
      } catch (err) {
        setEnrollCode('')
        throw err
      }
      setSecret(null)
      setEnrollCode('')
      rerender()
      toast({
        title: 'Two-factor authentication is on',
        description: 'You will be asked for a code from your authenticator app each time you sign in.',
      })
    })
  }

  const removeFactor = (factor: MultiFactorInfo) =>
    runSensitive(`remove-${factor.uid}`, async () => {
      if (!user) return
      if (
        !window.confirm(
          'Turn off two-factor authentication? Your account will be protected by your password only, and some actions (like payments) may become unavailable.',
        )
      ) {
        return
      }
      await unenrollFactor(user, factor)
      rerender()
      toast({ title: 'Two-factor authentication removed' })
    })

  // ── Password change ──
  const changePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }
    runSensitive('password', async () => {
      if (!user) return
      await updatePassword(user, newPassword)
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Password updated' })
    })
  }

  const copySecret = async () => {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret.secretKey)
      setCopied(true)
    } catch {
      /* clipboard blocked — the key is visible to copy manually */
    }
  }

  if (authLoading) {
    return (
      <StoneCard padding="lg">
        <p className="text-sm text-[color:var(--color-chessboard-smoke)]" style={display}>
          Loading security settings…
        </p>
      </StoneCard>
    )
  }

  if (!user) {
    return (
      <StoneCard padding="lg">
        <p className="text-sm text-[color:var(--color-chessboard-smoke)]" style={body}>
          Sign in to manage your account security.
        </p>
      </StoneCard>
    )
  }

  // Backend policy needs an MFA session but this session is single-factor.
  const policyNeedsMfa = Boolean(profile?.mfaRequired) && !profile?.mfaSession

  return (
    <div className="space-y-6">
      {policyNeedsMfa && (
        <div className="p-3 rounded-[3px] border border-[color:var(--color-chessboard-ember)]/40 bg-[color:var(--color-chessboard-ember)]/[0.08] text-sm text-[color:var(--color-chessboard-ember)] flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span style={body}>
            {totpOn
              ? 'Sign out and sign back in with your authenticator code to unlock payments and protected actions.'
              : 'Two-factor authentication is required for payments and protected actions. Set it up below.'}
          </span>
        </div>
      )}

      {error && (
        <div
          className="p-3 rounded-[3px] border border-[color:var(--color-chessboard-crimson)]/40 bg-[color:var(--color-chessboard-crimson)]/[0.08] text-sm text-[color:var(--color-chessboard-crimson-bright)]"
          style={display}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ── Email verification ── */}
      <StoneCard padding="none">
        <SectionHeader title="Email Verification" subtitle="Confirms you own the address used to sign in." />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Mail className="h-5 w-5 text-[color:var(--color-chessboard-gold)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-[color:var(--color-chessboard-ivory)] truncate" style={display}>
                {user.email}
              </p>
              <div className="mt-1">
                <StatusPill ok={emailVerified} okText="Verified" badText="Not verified" />
              </div>
            </div>
          </div>
          {!emailVerified && (
            <div className="flex gap-2 flex-wrap">
              <ChessboardCTA size="sm" variant="ghost" onClick={recheckVerification} disabled={busy !== null}>
                {busy === 'recheck' ? 'Checking…' : "I've verified"}
              </ChessboardCTA>
              <ChessboardCTA size="sm" onClick={resendVerification} disabled={busy !== null}>
                {busy === 'verify' ? 'Sending…' : 'Send link'}
              </ChessboardCTA>
            </div>
          )}
        </div>
      </StoneCard>

      {/* ── Two-factor authentication ── */}
      <StoneCard padding="none" accent="var(--color-chessboard-gold)">
        <SectionHeader
          title="Two-Factor Authentication"
          subtitle="Require a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy) when you sign in."
        />
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            {totpOn ? (
              <ShieldCheck className="h-5 w-5 text-[color:var(--color-chessboard-verdant)]" />
            ) : (
              <ShieldOff className="h-5 w-5 text-[color:var(--color-chessboard-smoke)]" />
            )}
            <StatusPill ok={totpOn} okText="On" badText="Off" />
          </div>

          {/* Enrolled factors */}
          {factors.length > 0 && (
            <ul className="divide-y divide-[color:var(--color-chessboard-ash)]/15 border border-[color:var(--color-chessboard-ash)]/20 rounded-[3px]">
              {factors.map((f) => (
                <li key={f.uid} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone className="h-4 w-4 text-[color:var(--color-chessboard-gold)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[color:var(--color-chessboard-ivory)] truncate" style={display}>
                        {f.displayName || 'Authenticator app'}
                      </p>
                      <p className="text-[11px] text-[color:var(--color-chessboard-smoke)]" style={body}>
                        Added {new Date(f.enrollmentTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChessboardCTA
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFactor(f)}
                    disabled={busy !== null}
                  >
                    {busy === `remove-${f.uid}` ? 'Removing…' : 'Remove'}
                  </ChessboardCTA>
                </li>
              ))}
            </ul>
          )}

          {/* Set-up flow */}
          {!totpOn && !secret && (
            <div className="space-y-3">
              {!emailVerified && (
                <p className="text-xs text-[color:var(--color-chessboard-ember)]" style={body}>
                  Verify your email address above before turning on two-factor authentication.
                </p>
              )}
              {!isPasswordAccount && (
                <p className="text-xs text-[color:var(--color-chessboard-smoke)]" style={body}>
                  Two-factor authentication is available for email-and-password accounts.
                </p>
              )}
              <ChessboardCTA
                size="sm"
                icon={ShieldCheck}
                onClick={beginEnrollment}
                disabled={busy !== null || !emailVerified || !isPasswordAccount}
              >
                {busy === 'enroll-start' ? 'Preparing…' : 'Set up authenticator app'}
              </ChessboardCTA>
            </div>
          )}

          {secret && (
            <div className="grid gap-6 md:grid-cols-[auto,1fr] items-start">
              <div className="rounded-[4px] bg-white p-3 w-fit mx-auto md:mx-0">
                <QRCodeSVG
                  value={totpQrUri(secret, user.email ?? 'account')}
                  size={168}
                  level="M"
                  aria-label="QR code for your authenticator app"
                />
              </div>
              <div className="space-y-4 min-w-0">
                <ol
                  className="list-decimal list-inside space-y-1 text-xs text-[color:var(--color-chessboard-smoke)]"
                  style={body}
                >
                  <li>Open your authenticator app and add a new account.</li>
                  <li>Scan the QR code, or enter the setup key below.</li>
                  <li>Type the 6-digit code the app shows to confirm.</li>
                </ol>
                <div>
                  <Label
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
                    style={display}
                  >
                    Setup key
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 min-w-0 break-all rounded-[3px] border border-[color:var(--color-chessboard-ash)]/30 bg-[color:var(--color-chessboard-rampart)]/60 px-2 py-1.5 text-xs text-[color:var(--color-chessboard-ivory)] tracking-[0.12em]">
                      {secret.secretKey}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-2 text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)]"
                      aria-label="Copy setup key"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
                    style={display}
                  >
                    Verification code
                  </Label>
                  <CodeInput value={enrollCode} onChange={setEnrollCode} onComplete={confirmEnrollment} autoFocus />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <ChessboardCTA
                    size="sm"
                    onClick={() => confirmEnrollment(enrollCode)}
                    disabled={busy !== null || enrollCode.length !== 6}
                  >
                    {busy === 'enroll-finish' ? 'Verifying…' : 'Turn on 2FA'}
                  </ChessboardCTA>
                  <ChessboardCTA
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSecret(null)
                      setEnrollCode('')
                    }}
                    disabled={busy !== null}
                  >
                    Cancel
                  </ChessboardCTA>
                </div>
              </div>
            </div>
          )}
        </div>
      </StoneCard>

      {/* ── Password ── */}
      {isPasswordAccount && (
        <StoneCard padding="none">
          <SectionHeader title="Password" subtitle="Use a long, unique password you don't use anywhere else." />
          <form onSubmit={changePassword} className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
                  style={display}
                >
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  className={INPUT_CLASSES}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
                  style={display}
                >
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  className={INPUT_CLASSES}
                />
              </div>
            </div>
            <ChessboardCTA type="submit" size="sm" icon={KeyRound} disabled={busy !== null}>
              {busy === 'password' ? 'Updating…' : 'Update password'}
            </ChessboardCTA>
          </form>
        </StoneCard>
      )}

      {/* ── Re-authentication dialog ── */}
      <Dialog
        open={reauthOpen}
        onOpenChange={(open) => {
          if (!open) {
            pendingAction.current = null
            setReauthOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={display}>Confirm it&apos;s you</DialogTitle>
            <DialogDescription style={body}>
              {reauthResolver
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'For your security, re-enter your password to continue.'}
            </DialogDescription>
          </DialogHeader>

          {reauthError && (
            <p className="text-sm text-[color:var(--color-chessboard-crimson-bright)]" role="alert">
              {reauthError}
            </p>
          )}

          {reauthResolver ? (
            <div className="flex justify-center py-2">
              <CodeInput value={reauthCode} onChange={setReauthCode} onComplete={submitReauthCode} autoFocus />
            </div>
          ) : (
            <form id="reauth-form" onSubmit={submitReauthPassword} className="space-y-2">
              <Label htmlFor="reauth-password" className="sr-only">
                Password
              </Label>
              <Input
                id="reauth-password"
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                required
                autoFocus
                className={INPUT_CLASSES}
              />
            </form>
          )}

          <DialogFooter>
            {reauthResolver ? (
              <ChessboardCTA
                size="sm"
                onClick={() => submitReauthCode(reauthCode)}
                disabled={busy === 'reauth' || reauthCode.length !== 6}
              >
                {busy === 'reauth' ? 'Verifying…' : 'Verify'}
              </ChessboardCTA>
            ) : (
              <ChessboardCTA size="sm" type="submit" form="reauth-form" disabled={busy === 'reauth'}>
                {busy === 'reauth' ? 'Checking…' : 'Continue'}
              </ChessboardCTA>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SecurityPanel
