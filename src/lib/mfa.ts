// ============================================
// Multi-factor authentication helpers (Firebase Identity Platform, TOTP).
// ============================================
//
// The second factor is an authenticator app (Google Authenticator, 1Password,
// Authy, …). Everything here runs in the browser against Firebase; the backend
// only reads the resulting `sign_in_second_factor` claim from the ID token.
//
// Like firebase.ts, call these only from effects / event handlers.

import {
  EmailAuthProvider,
  getMultiFactorResolver,
  multiFactor,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorInfo,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { getFirebaseAuth } from '@/src/lib/firebase'

/** Issuer shown next to the account in the authenticator app. */
export const TOTP_ISSUER = 'WarRoom'

/** True when a Firebase error means "password OK, now prove the second factor". */
export function isMfaRequiredError(err: unknown): err is MultiFactorError {
  return err instanceof FirebaseError && err.code === 'auth/multi-factor-auth-required'
}

/**
 * Thrown by AuthContext.login when the account has 2FA on. Carries the resolver
 * the login page needs to finish sign-in with a TOTP code.
 */
export class MfaChallenge extends Error {
  resolver: MultiFactorResolver
  constructor(resolver: MultiFactorResolver) {
    super('Two-factor verification required')
    this.name = 'MfaChallenge'
    this.resolver = resolver
  }
}

export function resolverFrom(err: MultiFactorError): MultiFactorResolver {
  return getMultiFactorResolver(getFirebaseAuth(), err)
}

/** The TOTP hint on a resolver, if the user has an authenticator enrolled. */
export function totpHint(resolver: MultiFactorResolver): MultiFactorInfo | undefined {
  return resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID)
}

/** Completes a pending MFA sign-in with a 6-digit TOTP code. */
export async function resolveWithTotp(
  resolver: MultiFactorResolver,
  code: string,
): Promise<UserCredential> {
  const hint = totpHint(resolver)
  if (!hint) {
    throw new Error('No authenticator app is enrolled on this account. Contact support to recover access.')
  }
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim())
  return resolver.resolveSignIn(assertion)
}

// ─── Enrolment ──────────────────────────────────────────────────────────────

export function enrolledFactors(user: User): MultiFactorInfo[] {
  return multiFactor(user).enrolledFactors
}

export function hasTotp(user: User): boolean {
  return enrolledFactors(user).some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID)
}

/** Step 1: create a TOTP secret. May throw auth/requires-recent-login. */
export async function startTotpEnrollment(user: User): Promise<TotpSecret> {
  const session = await multiFactor(user).getSession()
  return TotpMultiFactorGenerator.generateSecret(session)
}

/** The otpauth:// URI encoded in the QR code. */
export function totpQrUri(secret: TotpSecret, accountName: string): string {
  return secret.generateQrCodeUrl(accountName, TOTP_ISSUER)
}

/** Step 2: confirm the first code from the authenticator app and enrol it. */
export async function finishTotpEnrollment(
  user: User,
  secret: TotpSecret,
  code: string,
  displayName = 'Authenticator app',
): Promise<void> {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim())
  await multiFactor(user).enroll(assertion, displayName)
  // Pull a fresh ID token so the backend sees the MFA-backed session right away.
  await user.getIdToken(true)
}

/** Removes a second factor. May throw auth/requires-recent-login. */
export async function unenrollFactor(user: User, factor: MultiFactorInfo): Promise<void> {
  await multiFactor(user).unenroll(factor)
}

// ─── Re-authentication ──────────────────────────────────────────────────────

/**
 * Re-confirms the password for sensitive changes. If the account has 2FA on,
 * Firebase answers with an MFA challenge — that is surfaced as MfaChallenge so
 * the caller can ask for a code and finish with resolveWithTotp().
 */
export async function reauthenticateWithPassword(user: User, password: string): Promise<void> {
  if (!user.email) throw new Error('This account has no email address.')
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  } catch (err) {
    if (isMfaRequiredError(err)) throw new MfaChallenge(resolverFrom(err))
    throw err
  }
}

export function needsRecentLogin(err: unknown): boolean {
  return err instanceof FirebaseError && err.code === 'auth/requires-recent-login'
}

// ─── Email verification & password reset ────────────────────────────────────

function actionSettings() {
  if (typeof window === 'undefined') return undefined
  return { url: `${window.location.origin}/login` }
}

export async function sendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, actionSettings())
  } catch (err) {
    // An unauthorized continue-URL domain must not block the email itself.
    if (err instanceof FirebaseError && err.code === 'auth/unauthorized-continue-uri') {
      await sendEmailVerification(user)
      return
    }
    throw err
  }
}

/**
 * Sends a password-reset email. Resolves silently for unknown addresses so the
 * form never reveals whether an account exists.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), actionSettings())
  } catch (err) {
    if (err instanceof FirebaseError) {
      if (err.code === 'auth/user-not-found') return
      if (err.code === 'auth/unauthorized-continue-uri') {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
        return
      }
    }
    throw err
  }
}
