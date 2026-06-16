'use client'

// Lazy wrapper for the radar chart. recharts is the app's largest non-framework
// chunk (~95KB gzip); dynamically importing it (ssr:false) keeps it out of the
// initial JS so it loads only when a chart actually renders — notably it no
// longer ships just because a report page mounts (e.g. an unopened Competency tab).
import dynamic from 'next/dynamic'

export const CompetencyRadarChart = dynamic(
  () => import('@/components/competency-radar-chart').then((m) => m.CompetencyRadarChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-64 items-center justify-center text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Charting the realm&hellip;
      </div>
    ),
  },
)
