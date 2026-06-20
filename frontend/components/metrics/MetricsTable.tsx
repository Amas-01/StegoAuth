import type { MetricsSchema } from "@/lib/types"

interface MetricsTableProps {
  lsb: MetricsSchema
  dct: MetricsSchema
}

function better(
  lsbVal: number,
  dctVal: number,
  lowerIsBetter: boolean
): "LSB" | "DCT" {
  if (lowerIsBetter) return lsbVal <= dctVal ? "LSB" : "DCT"
  return lsbVal >= dctVal ? "LSB" : "DCT"
}

export default function MetricsTable({ lsb, dct }: MetricsTableProps) {
  const rows = [
    {
      label: "MSE",
      lsb: lsb.mse.toFixed(4),
      dct: dct.mse.toFixed(4),
      better: better(lsb.mse, dct.mse, true),
      note: "Lower is better",
    },
    {
      label: "PSNR (dB)",
      lsb: lsb.psnr.toFixed(2),
      dct: dct.psnr.toFixed(2),
      better: better(lsb.psnr, dct.psnr, false),
      note: "Higher is better",
    },
    {
      label: "SSIM",
      lsb: lsb.ssim.toFixed(6),
      dct: dct.ssim.toFixed(6),
      better: better(lsb.ssim, dct.ssim, false),
      note: "Higher is better",
    },
    {
      label: "Capacity (bits)",
      lsb: lsb.capacity_bits.toLocaleString(),
      dct: dct.capacity_bits.toLocaleString(),
      better: better(lsb.capacity_bits, dct.capacity_bits, false),
      note: "Higher is better",
    },
    {
      label: "Capacity (bytes)",
      lsb: lsb.capacity_bytes.toLocaleString(),
      dct: dct.capacity_bytes.toLocaleString(),
      better: better(lsb.capacity_bytes, dct.capacity_bytes, false),
      note: "Higher is better",
    },
    {
      label: "Processing Time (ms)",
      lsb: lsb.processing_time_ms.toFixed(1),
      dct: dct.processing_time_ms.toFixed(1),
      better: better(lsb.processing_time_ms, dct.processing_time_ms, true),
      note: "Lower is better",
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 font-medium text-slate-600">
              Metric
            </th>
            <th className="text-left py-2 pr-4 font-medium text-blue-600">
              LSB Result
            </th>
            <th className="text-left py-2 pr-4 font-medium text-orange-600">
              DCT Result
            </th>
            <th className="text-left py-2 font-medium text-slate-600">
              Better
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-700">{row.label}</td>
              <td className="py-2 pr-4 text-slate-800 font-mono">
                {row.lsb}
              </td>
              <td className="py-2 pr-4 text-slate-800 font-mono">
                {row.dct}
              </td>
              <td className="py-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    row.better === "LSB"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {row.better} &uarr;
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
