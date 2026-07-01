// ============================================
// Firebase client SDK — single source of auth truth on the browser.
// ============================================
//
// The NEXT_PUBLIC_FIREBASE_* values are public client identifiers (safe to ship
// to the browser by Firebase design). The backend independently verifies every
// ID token with the Admin SDK, so these keys grant no privileged access.
//
// IMPORTANT: Auth is initialized lazily via getFirebaseAuth() and must only be
// touched in the browser (effects / event handlers) — never at module top level.
// This keeps SSR / `next build` prerendering from ever evaluating Firebase, so a
// missing/placeholder API key can never fail the production build.

import { initializeApp, getApps, getApp, FirebaseError, type FirebaseApp } from 'firebase/app'
import { getAuth, signOut as fbSignOut, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/** True when the public Firebase env vars are present. */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

let cachedApp: FirebaseApp | undefined
let cachedAuth: Auth | undefined

function firebaseApp(): FirebaseApp {
  if (!cachedApp) {
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
  }
  return cachedApp
}

/**
 * getFirebaseAuth lazily initializes the Auth instance. Call it only from the
 * browser (inside effects or event handlers), never at module top level.
 */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(firebaseApp())
  }
  return cachedAuth
}

/**
 * getIdToken returns a fresh Firebase ID token for the signed-in user, or null.
 * The SDK transparently refreshes the token when it is close to expiry, so calling
 * this per request keeps the Authorization header valid without manual refresh logic.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const auth = getFirebaseAuth()
  // currentUser is null during SDK session-rehydration (e.g. navigating away and
  // back). Wait for the persisted session to restore before giving up, otherwise
  // a still-valid session sends no token → the backend 401s and signs the user out.
  if (!auth.currentUser) {
    try {
      await auth.authStateReady()
    } catch {
      // ignore — fall through to the currentUser check below
    }
  }
  const user = auth.currentUser
  if (!user) return null
  try {
    return await user.getIdToken(forceRefresh)
  } catch {
    return null
  }
}

/**
 * signOutUser ends the Firebase session and clears the cached backend profile.
 * Safe to call from non-React code (e.g. the API layer on a 401).
 */
export async function signOutUser(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fbSignOut(getFirebaseAuth())
  } catch {
    // ignore — we still clear local state below
  }
  localStorage.removeItem('token') // legacy key — cleared for good measure
  localStorage.removeItem('user')
  localStorage.removeItem('batch')
}

/** Maps Firebase auth error codes to friendly, user-facing copy. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password'
      case 'auth/email-already-in-use':
        return 'Email already registered'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Please enter a valid email address'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again in a moment.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      case 'auth/invalid-api-key':
      case 'auth/configuration-not-found':
        return 'Authentication is not configured. Please contact support.'
      default:
        return err.message.replace('Firebase: ', '')
    }
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
