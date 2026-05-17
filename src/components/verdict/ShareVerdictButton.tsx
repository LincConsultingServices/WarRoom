'use client'

import { useCallback, useState } from 'react'
import { Share2, Twitter, Linkedin, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// <ShareVerdictButton />
// ----------------------------------------------------------------
// Share-out CTA for the verdict ceremony. Graceful-degradation
// design — works without ANY new dependency, gains an image-
// download feature when `html2canvas` is installed.
//
// On click:
//   1. Always shows X/LinkedIn intent links + a copy-text option.
//   2. If `html2canvas` is installable (dynamic import), also
//      offers "Download image" which rasterises the provided
//      `cardRef` to a 1080×1080 PNG.
//   3. If the browser supports `navigator.share()` with files,
//      uses the native share sheet for the image (mobile path).
//
// Bundle cost: zero unless the user clicks the download button.
// html2canvas is dynamic-imported only on the rasterise path.
// ============================================================

interface ShareVerdictButtonProps {
  /** Ref to the <ShareCard /> DOM node to rasterise. */
  cardRef: React.RefObject<HTMLElement | null>
  /** Pre-built share copy (used by intent links + copy fallback). */
  shareText: string
  /** Optional explicit URL to share. Falls back to location.href. */
  shareUrl?: string
  className?: string
}

type ShareStatus = 'idle' | 'rasterising' | 'ready' | 'error'

export function ShareVerdictButton({
  cardRef,
  shareText,
  shareUrl,
  className,
}: ShareVerdictButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resolvedUrl = useCallback(() => {
    if (shareUrl) return shareUrl
    if (typeof window !== 'undefined') return window.location.href
    return ''
  }, [shareUrl])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) {
      setErrorMessage('No card to capture.')
      setStatus('error')
      return
    }
    setStatus('rasterising')
    setErrorMessage(null)
    try {
      // html2canvas is an optional peer dep — kept out of the static graph so
      // builds work without it. When installed, this dynamic import resolves
      // and the rasterise path runs; when not, it throws and we fall back.
      const moduleId = 'html2canvas'
      const html2canvasModule = (await import(/* @vite-ignore */ moduleId).catch(
        () => null,
      )) as { default?: (el: HTMLElement, opts?: unknown) => Promise<HTMLCanvasElement> } | null

      if (!html2canvasModule || typeof html2canvasModule.default !== 'function') {
        setErrorMessage('Image export needs html2canvas. Run `npm i html2canvas` to enable.')
        setStatus('error')
        return
      }

      const canvas: HTMLCanvasElement = await html2canvasModule.default(cardRef.current, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        logging: false,
      })

      // Try native share with file first (mobile)
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      )

      if (blob && typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
        const file = new File([blob], 'warroom-verdict.png', { type: 'image/png' })
        const data: ShareData = { files: [file], text: shareText, url: resolvedUrl() }
        const nav = navigator as Navigator & {
          canShare?: (d: ShareData) => boolean
          share: (d: ShareData) => Promise<void>
        }
        if (nav.canShare?.(data)) {
          try {
            await nav.share(data)
            setStatus('idle')
            return
          } catch {
            // user cancelled or share failed — fall through to download path
          }
        }
      }

      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'warroom-verdict.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setStatus('ready')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to capture verdict.')
      setStatus('error')
    }
  }, [cardRef, shareText, resolvedUrl])

  const handleTwitter = useCallback(() => {
    const params = new URLSearchParams({
      text: shareText,
      url: resolvedUrl(),
    })
    window.open(`https://x.com/intent/post?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }, [shareText, resolvedUrl])

  const handleLinkedIn = useCallback(() => {
    const params = new URLSearchParams({ url: resolvedUrl() })
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    )
  }, [resolvedUrl])

  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(`${shareText}\n${resolvedUrl()}`)
      setStatus('ready')
    } catch {
      setStatus('error')
      setErrorMessage('Copy failed.')
    }
  }, [shareText, resolvedUrl])

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleTwitter}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-4 py-2',
            'border-[color:var(--color-warroom-gold)]/30 bg-[color:var(--color-warroom-obsidian)]/60 text-foreground/80 backdrop-blur-md',
            'font-display text-xs font-bold uppercase tracking-[0.16em]',
            'transition-all duration-200',
            'hover:border-[color:var(--color-warroom-gold)]/70 hover:bg-[color:var(--color-warroom-obsidian)]/85 hover:text-[color:var(--color-warroom-gold)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
          )}
        >
          <Twitter className="h-4 w-4" /> Share to X
        </button>

        <button
          type="button"
          onClick={handleLinkedIn}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-4 py-2',
            'border-[color:var(--color-warroom-gold)]/30 bg-[color:var(--color-warroom-obsidian)]/60 text-foreground/80 backdrop-blur-md',
            'font-display text-xs font-bold uppercase tracking-[0.16em]',
            'transition-all duration-200',
            'hover:border-[color:var(--color-warroom-gold)]/70 hover:bg-[color:var(--color-warroom-obsidian)]/85 hover:text-[color:var(--color-warroom-gold)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
          )}
        >
          <Linkedin className="h-4 w-4" /> Share to LinkedIn
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={status === 'rasterising'}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-4 py-2',
            'border-[color:var(--color-warroom-gold)]/45 bg-[color:var(--color-warroom-obsidian)]/70 text-[color:var(--color-warroom-gold)] backdrop-blur-md',
            'font-display text-xs font-bold uppercase tracking-[0.16em]',
            'transition-all duration-200',
            'hover:border-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-obsidian)]/85',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {status === 'rasterising' ? (
            <Share2 className="h-4 w-4 animate-pulse" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {status === 'rasterising' ? 'Forging…' : 'Save image'}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-4 py-2',
            'border-[color:var(--color-warroom-gold)]/20 bg-transparent text-foreground/55',
            'font-display text-xs font-bold uppercase tracking-[0.16em]',
            'transition-all duration-200',
            'hover:border-[color:var(--color-warroom-gold)]/45 hover:text-foreground/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-warroom-gold)]',
          )}
        >
          {status === 'ready' ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      {errorMessage && (
        <p className="text-xs text-foreground/60" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
