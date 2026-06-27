'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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
    <div className="mb-6 bg-gray-900 rounded-xl p-3 pt-4">
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: hasBf ? 40 : 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtDate}
            minTickGap={48}
            interval="preserveStartEnd"
          />

          <YAxis
            yAxisId="w"
            domain={['auto', 'auto']}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}`}
            width={36}
          />

          {hasBf && (
            <YAxis
              yAxisId="bf"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
              width={32}
            />
          )}

          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(label: unknown) => fmtFull(String(label))}
            formatter={(value: unknown, name: unknown) =>
              name === 'weightKg'
                ? [`${value} kg`, 'Weight']
                : [`${value}%`, 'Body fat']
            }
          />

          {hasBf && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} formatter={name => name === 'weightKg' ? 'Weight' : 'Body fat'} />}

          <Line
            yAxisId="w"
            dataKey="weightKg"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ r: 3, fill: '#4ade80', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />

          {hasBf && (
            <Line
              yAxisId="bf"
              dataKey="bodyFatPct"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
