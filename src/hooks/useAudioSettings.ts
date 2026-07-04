'use client'

import { useEffect, useRef } from 'react'
import api from '@/src/lib/api'
import { useAudioStore } from '@/src/state/audioStore'
import { useAuth } from '@/src/context/AuthContext'

export function useAudioSettings() {
  // `profile` is the logged-in app user (AuthContext exposes no `user` field).
  const { profile: user } = useAuth()
  const store = useAudioStore()
  const initialLoadDone = useRef(false)
  const isSyncing = useRef(false)
  
  // 1. Pull settings from backend on login
  useEffect(() => {
    if (!user || initialLoadDone.current) return
    
    let active = true
    
    api.settings.getSettings().then(settings => {
      if (!active) return
      
      // Update local store with backend state
      useAudioStore.setState({
        isSfxMuted: settings.sfxMuted,
        isAmbientMuted: settings.ambientMuted,
        isNarratorMuted: settings.narratorMuted,
        isVoiceMuted: settings.voiceMuted
      })
      
      // Update local storage to keep it in sync for fast initial load next time
      try {
        window.localStorage.setItem('wr_ch_sfx_muted', String(settings.sfxMuted))
        window.localStorage.setItem('wr_ch_ambient_muted', String(settings.ambientMuted))
        window.localStorage.setItem('wr_ch_narrator_muted', String(settings.narratorMuted))
        window.localStorage.setItem('wr_ch_voice_muted', String(settings.voiceMuted))
        // And legacy narrator key
        window.localStorage.setItem('wr_narrator_muted', String(settings.narratorMuted))
      } catch { /* ignore */ }
      
      initialLoadDone.current = true
      
    }).catch(err => {
      console.warn('[AudioSettings] Failed to load settings from backend. Using local defaults.')
      // Allow retry if it failed (e.g. transient network error)
      initialLoadDone.current = false 
    })
    
    return () => { active = false }
  }, [user])
  
  // 2. Push settings to backend on change (debounced/tracked to avoid loops)
  useEffect(() => {
    if (!user || !initialLoadDone.current) return
    if (isSyncing.current) return
    
    const timeout = setTimeout(() => {
      isSyncing.current = true
      api.settings.updateSettings({
        sfxMuted: store.isSfxMuted,
        ambientMuted: store.isAmbientMuted,
        narratorMuted: store.isNarratorMuted,
        voiceMuted: store.isVoiceMuted
      }).finally(() => {
        isSyncing.current = false
      })
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [store.isSfxMuted, store.isAmbientMuted, store.isNarratorMuted, store.isVoiceMuted, user])
}