'use client'

import { useEffect, useState } from 'react'

interface UseAssetResult {
  src: string
  isLoaded: boolean
  hasFailed: boolean
}

/**
 * useAsset — preflight an image/video URL.
 *
 * Returns `{ src, isLoaded, hasFailed }`. Components should render
 * a CSS placeholder fallback when `hasFailed` is true. Per CLAUDE.md,
 * the app must look intentional when assets are missing.
 */
export function useAsset(src: string): UseAssetResult {
  const [state, setState] = useState<UseAssetResult>({
    src,
    isLoaded: false,
    hasFailed: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!src) {
      setState({ src, isLoaded: false, hasFailed: true })
      return
    }

    let cancelled = false
    const lower = src.toLowerCase()
    const isVideo = /\.(webm|mp4|mov)(\?|$)/.test(lower)

    if (isVideo) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      const onLoaded = () => {
        if (cancelled) return
        setState({ src, isLoaded: true, hasFailed: false })
      }
      const onError = () => {
        if (cancelled) return
        setState({ src, isLoaded: false, hasFailed: true })
      }
      video.addEventListener('loadedmetadata', onLoaded, { once: true })
      video.addEventListener('error', onError, { once: true })
      video.src = src
      return () => {
        cancelled = true
        video.removeEventListener('loadedmetadata', onLoaded)
        video.removeEventListener('error', onError)
      }
    }

    const img = new Image()
    const onLoad = () => {
      if (cancelled) return
      setState({ src, isLoaded: true, hasFailed: false })
    }
    const onError = () => {
      if (cancelled) return
      setState({ src, isLoaded: false, hasFailed: true })
    }
    img.addEventListener('load', onLoad, { once: true })
    img.addEventListener('error', onError, { once: true })
    img.src = src
    return () => {
      cancelled = true
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', onError)
    }
  }, [src])

  return state
}
