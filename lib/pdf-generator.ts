import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import type { EvaluationReport } from '@/src/types'

interface PDFGenerationOptions {
  report: EvaluationReport
}

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

const COLORS = {
  gold: rgb(201, 162, 39),
  ivory: rgb(248, 247, 243),
  smoke: rgb(156, 147, 136),
  rampart: rgb(70, 68, 65),
  void: rgb(23, 20, 18),
}

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  spaceWidth: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = testLine.length * spaceWidth

    if (testWidth > maxWidth) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

export async function generateReportPDF(options: PDFGenerationOptions): Promise<Uint8Array> {
  const { report } = options

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont('Helvetica')
  const boldFont = await pdfDoc.embedFont('Helvetica-Bold')

  let pageNumber = 1
  let yPosition = PAGE_HEIGHT - MARGIN

  function newPage(): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    yPosition = PAGE_HEIGHT - MARGIN
    pageNumber++
    return page
  }

  function drawFooter(page: PDFPage): void {
    page.drawText(`Page ${pageNumber - 1}`, {
      x: MARGIN,
      y: 20,
      size: 9,
      font,
      color: COLORS.smoke,
    })

    const reportDate = new Date(report.generatedAt).toLocaleDateString()
    page.drawText(`Generated: ${reportDate}`, {
      x: PAGE_WIDTH - MARGIN - 150,
      y: 20,
      size: 9,
      font,
      color: COLORS.smoke,
    })
  }

  function drawText(
    page: PDFPage,
    text: string,
    opts: {
      size?: number
      bold?: boolean
      color?: typeof COLORS['gold']
      x?: number
      maxWidth?: number
    } = {},
  ): number {
    const size = opts.size ?? 11
    const bold = opts.bold ?? false
    const selectedFont = bold ? boldFont : font
    const color = opts.color ?? COLORS.smoke
    const x = opts.x ?? MARGIN
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH

    const spaceWidth = 3.5
    const lines = wrapText(text, maxWidth, size, spaceWidth)

    for (const line of lines) {
      if (yPosition - size < MARGIN + 30) {
        drawFooter(page)
        page = newPage()
      }

      page.drawText(line, {
        x,
        y: yPosition,
        size,
        font: selectedFont,
        color,
      })

      yPosition -= size + 6
    }

    return yPosition
  }

  function drawHeading(page: PDFPage, text: string): void {
    drawText(page, text, {
      size: 18,
      bold: true,
      color: COLORS.gold,
    })
    yPosition -= 8
  }

  function drawSubheading(page: PDFPage, text: string): void {
    drawText(page, text, {
      size: 13,
      bold: true,
      color: COLORS.ivory,
    })
    yPosition -= 6
  }

  function drawSectionTitle(page: PDFPage, text: string): void {
    yPosition -= 4
    drawText(page, text, {
      size: 12,
      bold: true,
      color: COLORS.gold,
    })
    yPosition -= 4
  }

  function drawSeparator(page: PDFPage): void {
    yPosition -= 6
    page.drawLine({
      start: { x: MARGIN, y: yPosition },
      end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
      thickness: 1,
      color: COLORS.gold,
      opacity: 0.3,
    })
    yPosition -= 8
  }

  // ─── PAGE 1: TITLE & OVERVIEW ──────────────────────────────────

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  drawHeading(currentPage, 'Evaluation Report')
  yPosition -= 2

  drawText(currentPage, `${report.entrepreneurType} • ${report.organizationalRole}`, {
    size: 11,
    color: COLORS.smoke,
  })
  yPosition -= 10

  drawSeparator(currentPage)

  if (report.archetypeNarrative) {
    drawSubheading(currentPage, 'Archetype Profile')
    yPosition -= 4
    drawText(currentPage, report.archetypeNarrative, {
      size: 10,
      color: COLORS.smoke,
      maxWidth: CONTENT_WIDTH,
    })
    yPosition -= 8
  }

  drawFooter(currentPage)

  // ─── PAGE 2: COMPETENCY PROFILE ─────────────────────────────────

  currentPage = newPage()
  drawHeading(currentPage, 'Competency Profile')
  yPosition -= 6

  // Competency Table
  if (report.competencyRanking && report.competencyRanking.length > 0) {
    const ranking = report.competencyRanking

    // Table header
    const col1X = MARGIN
    const col2X = MARGIN + 100
    const col3X = MARGIN + 280
    const col4X = MARGIN + 380

    currentPage.drawText('Competency', {
      x: col1X,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: COLORS.gold,
    })
    currentPage.drawText('Code', {
      x: col2X,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: COLORS.gold,
    })
    currentPage.drawText('Score', {
      x: col3X,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: COLORS.gold,
    })
    currentPage.drawText('Category', {
      x: col4X,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: COLORS.gold,
    })

    yPosition -= 14

    // Table rows
    for (const comp of ranking) {
      if (yPosition - 12 < MARGIN + 40) {
        drawFooter(currentPage)
        currentPage = newPage()
      }

      const scaledScore = ((comp.weightedAverage / 3) * 10).toFixed(1)
      const categoryLabel = comp.category.replace(/_/g, ' ')

      currentPage.drawText(comp.name, {
        x: col1X,
        y: yPosition,
        size: 9,
        font,
        color: COLORS.ivory,
      })
      currentPage.drawText(comp.code, {
        x: col2X,
        y: yPosition,
        size: 9,
        font: boldFont,
        color: COLORS.gold,
      })
      currentPage.drawText(scaledScore, {
        x: col3X,
        y: yPosition,
        size: 9,
        font,
        color: COLORS.smoke,
      })
      currentPage.drawText(categoryLabel, {
        x: col4X,
        y: yPosition,
        size: 9,
        font,
        color: COLORS.smoke,
      })

      yPosition -= 12
    }

    yPosition -= 6
  }

  // Role Fit
  if (report.roleFitMap) {
    drawSectionTitle(currentPage, 'Role Fit Analysis')
    yPosition -= 2

    drawText(currentPage, `Role: ${report.roleFitMap.role}`, {
      size: 10,
      bold: true,
      color: COLORS.gold,
    })
    yPosition -= 4

    drawText(currentPage, report.roleFitMap.bestEnvironment, {
      size: 9,
      color: COLORS.smoke,
    })
    yPosition -= 8
  }

  // Action Plan
  if (report.actionPlan && report.actionPlan.length > 0) {
    drawSectionTitle(currentPage, 'Action Plan')
    yPosition -= 2

    for (const item of report.actionPlan) {
      if (yPosition - 20 < MARGIN + 40) {
        drawFooter(currentPage)
        currentPage = newPage()
      }

      drawText(currentPage, `${item.competency} — ${item.action}`, {
        size: 9,
        color: COLORS.smoke,
      })
      drawText(currentPage, `Target: ${item.targetDate}`, {
        size: 8,
        color: COLORS.smoke,
      })
      yPosition -= 4
    }
  }

  drawFooter(currentPage)

  // ─── PAGE 3: AI ANALYSIS ───────────────────────────────────────

  currentPage = newPage()
  drawHeading(currentPage, 'Detailed AI Analysis')
  yPosition -= 6

  if (report.detailedAnalysis) {
    const analysisLines = report.detailedAnalysis.split('\n')

    for (const line of analysisLines) {
      const trimmed = line.trim()

      if (!trimmed) {
        yPosition -= 4
      } else if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        if (yPosition - 16 < MARGIN + 40) {
          drawFooter(currentPage)
          currentPage = newPage()
        }
        drawSectionTitle(currentPage, trimmed.replace(/^#+\s/, ''))
        yPosition -= 2
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (yPosition - 12 < MARGIN + 40) {
          drawFooter(currentPage)
          currentPage = newPage()
        }
        const bulletText = trimmed.slice(2)
        currentPage.drawText('•', {
          x: MARGIN,
          y: yPosition,
          size: 9,
          font,
          color: COLORS.gold,
        })
        drawText(currentPage, bulletText, {
          size: 9,
          color: COLORS.smoke,
          x: MARGIN + 12,
        })
        yPosition -= 4
      } else {
        if (yPosition - 12 < MARGIN + 40) {
          drawFooter(currentPage)
          currentPage = newPage()
        }
        drawText(currentPage, trimmed, {
          size: 9,
          color: COLORS.smoke,
        })
        yPosition -= 4
      }
    }
  }

  drawFooter(currentPage)

  // ─── PAGE 4: USER RESPONSES ────────────────────────────────────

  currentPage = newPage()
  drawHeading(currentPage, 'Your Responses')
  yPosition -= 6

  if (report.userResponses && report.userResponses.length > 0) {
    const grouped: Record<string, typeof report.userResponses> = {}

    for (const resp of report.userResponses) {
      const stage = resp.stageName || 'Unknown'
      if (!grouped[stage]) grouped[stage] = []
      grouped[stage].push(resp)
    }

    for (const [stageName, responses] of Object.entries(grouped)) {
      if (yPosition - 20 < MARGIN + 40) {
        drawFooter(currentPage)
        currentPage = newPage()
      }

      drawSubheading(currentPage, stageName)
      yPosition -= 4

      for (const entry of responses) {
        if (yPosition - 16 < MARGIN + 40) {
          drawFooter(currentPage)
          currentPage = newPage()
        }

        // Question
        const qText = entry.questionText || entry.questionId || 'Question'
        drawText(currentPage, `Q: ${qText}`, {
          size: 9,
          bold: true,
          color: COLORS.gold,
          maxWidth: CONTENT_WIDTH,
        })
        yPosition -= 2

        // User Answer
        const userAnswer = entry.selectedOptionText || JSON.stringify(entry.response || '')
        drawText(currentPage, `Your Answer: ${userAnswer}`, {
          size: 8,
          color: COLORS.ivory,
          maxWidth: CONTENT_WIDTH,
        })
        yPosition -= 4

        // Ideal Path if available
        if (entry.idealOptionText) {
          drawText(currentPage, `Ideal Path: ${entry.idealOptionText}`, {
            size: 8,
            color: COLORS.smoke,
            maxWidth: CONTENT_WIDTH,
          })
          yPosition -= 4
        }

        yPosition -= 2
      }

      yPosition -= 4
    }
  }

  drawFooter(currentPage)

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

export function downloadPDF(
  pdfBytes: Uint8Array,
  filename: string = 'Evaluation_Report.pdf',
): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
