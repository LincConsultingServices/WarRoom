'use client'

// ============================================
// AuthProvider — listens to Firebase auth state and reconciles it with the
// Chessboard backend via POST /auth/sync.
//
// It keeps localStorage['user'] and localStorage['batch'] populated as the app's
// profile cache, so every existing component that reads those keys (sidebars,
// route guards, useSimulation, leaderboard) keeps working unchanged.
// ============================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getFirebaseAuth, signOutUser } from '@/src/lib/firebase'
import api from '@/src/lib/api'
import type { BatchInfo } from '@/src/types'

export interface AuthProfile {
  id: string
  email: string
  name: string
  batchCode?: string
  role: string
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: AuthProfile | null
  batch: BatchInfo | null
  loading: boolean
  login: (email: string, password: string, batchCode?: string) => Promise<AuthProfile>
  register: (email: string, password: string, batchCode: string, name?: string) => Promise<AuthProfile>
  logout: () => Promise<void>
  refresh: () => Promise<AuthProfile>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function cacheProfile(profile: AuthProfile, batch: BatchInfo | null) {
  if (typeof window === 'undefined') return
  localStorage.setItem('user', JSON.stringify(profile))
  if (batch) localStorage.setItem('batch', JSON.stringify(batch))
  else localStorage.removeItem('batch')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [batch, setBatch] = useState<BatchInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Guards the listener from auto-syncing while an explicit login/register (which
  // may carry a batch code) is in flight — avoids a race for brand-new signups.
  const manualAuthInFlight = useRef(false)

  // Hydrate the cached profile synchronously on first paint so route guards that
  // read localStorage don't flash a redirect while Firebase restores the session.
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      const b = JSON.parse(localStorage.getItem('batch') || 'null')
      if (u) setProfile(u)
      if (b) setBatch(b)
    } catch {
      /* ignore malformed cache */
    }
  }, [])

  const applySync = useCallback(
    async (batchCode?: string, name?: string): Promise<AuthProfile> => {
      const res = await api.auth.sync(batchCode, name)
      const p = res.user as unknown as AuthProfile
      const b = (res.batch as BatchInfo | undefined) ?? null
      setProfile(p)
      setBatch(b)
      cacheProfile(p, b)
      return p
    },
    [],
  )

  useEffect(() => {
    let firebaseAuth: ReturnType<typeof getFirebaseAuth> | null = null
    try {
      firebaseAuth = getFirebaseAuth()
    } catch {
      // Firebase env not configured — render the app as logged-out rather than crash.
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (!fbUser) {
        setProfile(null)
        setBatch(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          localStorage.removeItem('batch')
        }
        setLoading(false)
        return
      }

      // A returning user or admin: refresh the backend profile silently. Brand-new
      // signups are provisioned by register() (which carries the batch code), so we
      // skip auto-sync while that explicit flow is running and ignore a
      // not-yet-provisioned error here.
      if (!manualAuthInFlight.current) {
        try {
          await applySync()
        } catch {
          /* unprovisioned (mid-registration) — register() will complete it */
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [applySync])

  const login = useCallback(
    async (email: string, password: string, batchCode?: string): Promise<AuthProfile> => {
      manualAuthInFlight.current = true
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
        return await applySync(batchCode)
      } finally {
        manualAuthInFlight.current = false
      }
    },
    [applySync],
  )

  const register = useCallback(
    async (email: string, password: string, batchCode: string, name?: string): Promise<AuthProfile> => {
      manualAuthInFlight.current = true
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      try {
        if (name) {
          await updateProfile(cred.user, { displayName: name })
        }
        return await applySync(batchCode, name)
      } catch (err) {
        // Roll back the orphaned Firebase account so the user can retry cleanly.
        try {
          await cred.user.delete()
        } catch {
          /* ignore */
        }
        throw err
      } finally {
        manualAuthInFlight.current = false
      }
    },
    [applySync],
  )

  const logout = useCallback(async (): Promise<void> => {
    await signOutUser()
    setFirebaseUser(null)
    setProfile(null)
    setBatch(null)
  }, [])

  const refresh = useCallback((): Promise<AuthProfile> => applySync(), [applySync])

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, batch, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
