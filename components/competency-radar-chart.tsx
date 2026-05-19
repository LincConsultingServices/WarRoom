'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

interface CompetencyRadarChartProps {
  spiderData: Record<string, number> // {"C1": 3.5, "C2": 4.1}
  competencyRanking: { code: string; name: string }[]
}

export function CompetencyRadarChart({ spiderData, competencyRanking }: CompetencyRadarChartProps) {
  // Convert dict to array for recharts, scaling from out-of-3 to out-of-10
  const data = competencyRanking.map((comp) => {
    const rawScore = Number(spiderData[comp.code] ?? 0);
    const scaledScore = (rawScore / 3) * 10;
    
    return {
      subject: comp.name,
      score: Number(scaledScore.toFixed(1)),
      fullMark: 10,
    }
  })

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PolarRadiusAxis angle={30} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10] as any[]} />
          <Radar name="Competency Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderRadius: '8px' }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
