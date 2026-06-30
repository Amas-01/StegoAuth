"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface PSNRBarChartProps {
  lsbPsnr: number
  dctPsnr: number
}

export default function PSNRBarChart({ lsbPsnr, dctPsnr }: PSNRBarChartProps) {
  const data = [
    { technique: "LSB", psnr: parseFloat(lsbPsnr.toFixed(2)) },
    { technique: "DCT", psnr: parseFloat(dctPsnr.toFixed(2)) },
  ]

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5 font-mono">
        PSNR Comparison (dB)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
          <XAxis
            dataKey="technique"
            tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: "#94a3b8" }}
            stroke="#475569"
          />
          <YAxis
            domain={[0, Math.max(lsbPsnr, dctPsnr) + 5]}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            stroke="#475569"
          />
          <ReferenceLine
            y={40}
            stroke="#22c55e"
            strokeDasharray="4 4"
            label={{
              value: "40 dB threshold",
              fill: "#22c55e",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
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
            formatter={(value: number) => [`${value} dB`, "PSNR"]}
          />
          <Bar dataKey="psnr" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <rect
                key={index}
                fill={entry.technique === "LSB" ? "#3b82f6" : "#f97316"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SSIMBarChartProps {
  lsbSsim: number
  dctSsim: number
}

export function SSIMBarChart({ lsbSsim, dctSsim }: SSIMBarChartProps) {
  const data = [
    { technique: "LSB", ssim: parseFloat(lsbSsim.toFixed(6)) },
    { technique: "DCT", ssim: parseFloat(dctSsim.toFixed(6)) },
  ]

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5 font-mono">
        SSIM Comparison
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
          <XAxis
            dataKey="technique"
            tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: "#94a3b8" }}
            stroke="#475569"
          />
          <YAxis
            domain={[0.98, 1]}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "#94a3b8" }}
            stroke="#475569"
          />
          <ReferenceLine
            y={0.98}
            stroke="#22c55e"
            strokeDasharray="4 4"
            label={{
              value: "0.98 threshold",
              fill: "#22c55e",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
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
          <Bar dataKey="ssim" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <rect
                key={index}
                fill={entry.technique === "LSB" ? "#3b82f6" : "#f97316"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
