"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface BERLineChartProps {
  data: Array<{
    quality_factor: number
    lsb: { ber: number }
    dct: { ber: number }
  }>
}

export default function BERLineChart({ data }: BERLineChartProps) {
  const chartData = [...data]
    .sort((a, b) => a.quality_factor - b.quality_factor)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700 mb-4">
        Figure 4.4: Mean BER vs JPEG Quality Factor — LSB vs DCT
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="quality_factor"
            tick={{ fontSize: 12 }}
            label={{
              value: "Quality Factor",
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            label={{
              value: "Bit Error Rate (BER)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={0}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{
              value: "Perfect Recovery",
              position: "right",
              fontSize: 11,
              fill: "#22c55e",
            }}
          />
          <Line
            type="monotone"
            dataKey="lsb.ber"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6" }}
            name="LSB"
          />
          <Line
            type="monotone"
            dataKey="dct.ber"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f97316" }}
            name="DCT"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PSNRLineChartProps {
  data: Array<{
    quality_factor: number
    lsb: { post_compression_psnr: number }
    dct: { post_compression_psnr: number }
  }>
}

export function PSNRLineChart({ data }: PSNRLineChartProps) {
  const chartData = [...data]
    .sort((a, b) => a.quality_factor - b.quality_factor)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700 mb-4">
        Figure 4.5: Post-Compression PSNR vs JPEG Quality Factor
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="quality_factor"
            tick={{ fontSize: 12 }}
            label={{
              value: "Quality Factor",
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />
          <YAxis
            domain={[0, 60]}
            tick={{ fontSize: 12 }}
            label={{
              value: "Post-Compression PSNR (dB)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={40}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{
              value: "Imperceptibility Threshold (40 dB)",
              position: "right",
              fontSize: 11,
              fill: "#22c55e",
            }}
          />
          <Line
            type="monotone"
            dataKey="lsb.post_compression_psnr"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6" }}
            name="LSB"
          />
          <Line
            type="monotone"
            dataKey="dct.post_compression_psnr"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f97316" }}
            name="DCT"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
