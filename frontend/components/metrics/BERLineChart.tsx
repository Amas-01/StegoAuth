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
  const chartData = [...data].sort((a, b) => a.quality_factor - b.quality_factor)

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5 font-mono">
        Mean BER vs JPEG Quality Factor — LSB vs DCT
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#94a3b8"
            opacity={0.2}
          />
          <XAxis
            dataKey="quality_factor"
            reversed={true}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            label={{
              value: "JPEG Quality Factor",
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-mono)" },
            }}
            stroke="#475569"
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            label={{
              value: "BER",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-mono)" },
            }}
            stroke="#475569"
          />
          <ReferenceLine
            y={0}
            stroke="#22c55e"
            strokeDasharray="4 4"
            label={{
              value: "Perfect Recovery",
              fill: "#22c55e",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              position: "right",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Legend
            wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "12px", paddingTop: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="lsb.ber"
            name="LSB"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: "#3b82f6", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#60a5fa" }}
          />
          <Line
            type="monotone"
            dataKey="dct.ber"
            name="DCT"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: "#f97316", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#fb923c" }}
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
  const chartData = [...data].sort((a, b) => a.quality_factor - b.quality_factor)

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5 font-mono">
        Post-Compression PSNR vs JPEG Quality Factor
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#94a3b8"
            opacity={0.2}
          />
          <XAxis
            dataKey="quality_factor"
            reversed={true}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            label={{
              value: "JPEG Quality Factor",
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-mono)" },
            }}
            stroke="#475569"
          />
          <YAxis
            domain={[0, 60]}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            label={{
              value: "PSNR (dB)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-mono)" },
            }}
            stroke="#475569"
          />
          <ReferenceLine
            y={40}
            stroke="#22c55e"
            strokeDasharray="4 4"
            label={{
              value: "Imperceptibility Threshold (40 dB)",
              fill: "#22c55e",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              position: "right",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Legend
            wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "12px", paddingTop: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="lsb.post_compression_psnr"
            name="LSB"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: "#3b82f6", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#60a5fa" }}
          />
          <Line
            type="monotone"
            dataKey="dct.post_compression_psnr"
            name="DCT"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: "#f97316", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#fb923c" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
