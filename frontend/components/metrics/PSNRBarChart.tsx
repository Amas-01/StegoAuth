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
    { name: "PSNR (dB)", LSB: lsbPsnr, DCT: dctPsnr },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700 mb-4">
        PSNR Comparison
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 60]}
            tick={{ fontSize: 12 }}
            label={{
              value: "dB",
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
          <Bar dataKey="LSB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="DCT" fill="#f97316" radius={[4, 4, 0, 0]} />
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
    { name: "SSIM", LSB: lsbSsim, DCT: dctSsim },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700 mb-4">
        SSIM Comparison
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0.9, 1]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={0.98}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{
              value: "High Fidelity Threshold (0.98)",
              position: "right",
              fontSize: 11,
              fill: "#22c55e",
            }}
          />
          <Bar dataKey="LSB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="DCT" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
