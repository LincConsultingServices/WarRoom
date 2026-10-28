'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { EvaluationReport } from '@/src/types'
import { useToast } from '@/hooks/use-toast'
import { downloadPDF, generateReportPDF } from '@/lib/pdf-generator'

export function DownloadReportButton({ report }: { report: EvaluationReport }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  async function handleDownload() {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      const pdfBytes = await generateReportPDF({ report })
      const safeName = report.organizationalRole?.trim().replace(/[^a-z0-9]+/gi, '_') || 'Founder'
      downloadPDF(pdfBytes, `Evaluation_Report_${safeName}.pdf`)
      toast({
        title: 'Report downloaded',
        description: 'Your complete evaluation report is ready as a PDF.',
      })
    } catch {
      toast({
        title: 'Download failed',
        description: 'We could not generate the report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      aria-label="Download Report as PDF"
      title="Download Report as PDF"
      className="inline-flex size-11 items-center justify-center rounded-md border border-[color:var(--color-chessboard-gold)]/25 bg-[color:var(--color-chessboard-rampart)]/60 text-[color:var(--color-chessboard-gold)] shadow-sm transition-colors hover:border-[color:var(--color-chessboard-gold)]/55 hover:bg-[color:var(--color-chessboard-gold)]/10 disabled:cursor-wait disabled:opacity-60"
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      <span className="sr-only">Download Report as PDF</span>
    </button>
  )
}

export default DownloadReportButton
