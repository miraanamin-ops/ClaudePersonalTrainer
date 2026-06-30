'use client'

import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type ActivityChartPoint = {
  label: string
  distKm: number | null
  durMin: number | null
  pace: number | null
  totalCal: number
}

function fmtPace(val: number | null | undefined): string {
  if (val == null || val <= 0) return '--'
  const whole = Math.floor(val)
  const secs = Math.round((val - whole) * 60)
  return `${whole}:${String(secs).padStart(2, '0')}`
}

const TOOLTIP_STYLE = {
  background: '#201f1f',
  border: '1px solid #353534',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e5e2e1',
}

const TICK = { fill: '#c8c6c5', fontSize: 10 }

export default function ActivityCharts({ data }: { data: ActivityChartPoint[] }) {
  const runData = data.filter(d => d.distKm !== null && d.distKm > 0)
  const hasCalData = data.some(d => d.totalCal > 0)

  return (
    <div className="space-y-md mb-lg">
      {/* Distance + Pace */}
      {runData.length >= 2 && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <div className="flex items-start justify-between mb-xs">
            <h3 className="text-headline-md text-on-surface">Run Distance &amp; Pace</h3>
            <div className="flex flex-col items-end gap-0.5 text-[10px] text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-primary-container inline-block rounded" />
                km
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-secondary inline-block rounded" />
                pace (lower=faster)
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={runData} margin={{ top: 4, right: 44, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={48} interval="preserveStartEnd" />
              <YAxis
                yAxisId="dist"
                domain={[0, 'auto']}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <YAxis
                yAxisId="pace"
                orientation="right"
                domain={['auto', 'auto']}
                reversed
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={v => fmtPace(v)}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: unknown, name: unknown) => {
                  if (name === 'distKm') return [`${Number(value).toFixed(2)} km`, 'Distance']
                  if (name === 'pace') return [`${fmtPace(Number(value))}/km`, 'Pace']
                  return [String(value), String(name)]
                }}
              />
              <Line
                yAxisId="dist"
                dataKey="distKm"
                stroke="#39ff14"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#39ff14', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#39ff14' }}
                connectNulls={false}
              />
              <Line
                yAxisId="pace"
                dataKey="pace"
                stroke="#c8c6c5"
                strokeWidth={2}
                dot={{ r: 3, fill: '#c8c6c5', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Run Time */}
      {runData.length >= 2 && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <h3 className="text-headline-md text-on-surface mb-xs">Run Time</h3>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={runData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={48} interval="preserveStartEnd" />
              <YAxis
                domain={[0, 'auto']}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={v => `${v}m`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: unknown) => [`${Math.round(Number(value))} min`, 'Duration']}
              />
              <Line
                dataKey="durMin"
                stroke="#39ff14"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#39ff14', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#39ff14' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Total Calories */}
      {hasCalData && data.length >= 2 && (
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md">
          <h3 className="text-headline-md text-on-surface mb-xs">Total Calories per Session</h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={48} interval="preserveStartEnd" />
              <YAxis domain={[0, 'auto']} tick={TICK} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: unknown) => [`${value} kcal`, 'Calories']}
              />
              <Bar dataKey="totalCal" fill="#39ff14" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
