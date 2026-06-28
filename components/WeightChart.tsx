'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type DataPoint = {
  date: string
  weightKg: number
  bodyFatPct: number | null
}

function fmtDate(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`
}

function fmtFull(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export default function WeightChart({ data }: { data: DataPoint[] }) {
  const hasBf = data.some(d => d.bodyFatPct !== null)

  return (
    <div className="bg-surface-container border border-surface-container-highest rounded-xl p-md mb-xl">
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h3 className="text-headline-md text-on-surface">Weight Trend</h3>
          <p className="text-body-sm text-secondary">Last {data.length} entries</p>
        </div>
        {hasBf && (
          <div className="flex items-center gap-md text-label-caps text-secondary">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary-container inline-block rounded" />Weight</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-tertiary-container inline-block rounded" />BF%</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: hasBf ? 36 : 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#c8c6c5', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtDate}
            minTickGap={48}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="w"
            domain={['auto', 'auto']}
            tick={{ fill: '#c8c6c5', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          {hasBf && (
            <YAxis
              yAxisId="bf"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fill: '#c8c6c5', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
              width={28}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#201f1f',
              border: '1px solid #353534',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e5e2e1',
            }}
            labelFormatter={(label: unknown) => fmtFull(String(label))}
            formatter={(value: unknown, name: unknown) =>
              name === 'weightKg' ? [`${value} kg`, 'Weight'] : [`${value}%`, 'Body fat']
            }
          />
          <Line
            yAxisId="w"
            dataKey="weightKg"
            stroke="#39ff14"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#39ff14', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#39ff14' }}
            connectNulls={false}
          />
          {hasBf && (
            <Line
              yAxisId="bf"
              dataKey="bodyFatPct"
              stroke="#ffd3ce"
              strokeWidth={2}
              dot={{ r: 3, fill: '#ffd3ce', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
