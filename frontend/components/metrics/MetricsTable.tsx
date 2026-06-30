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
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 rounded-tl-lg">
              Metric
            </th>
            <th className="text-left py-2.5 pr-4 font-medium text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800/50 px-3">
              LSB Result
            </th>
            <th className="text-left py-2.5 pr-4 font-medium text-orange-600 dark:text-orange-400 bg-gray-50 dark:bg-gray-800/50 px-3">
              DCT Result
            </th>
            <th className="text-left py-2.5 font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 rounded-tr-lg">
              Better
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-2.5 pr-4 px-3 text-gray-700 dark:text-gray-300">
                {row.label}
              </td>
              <td className="py-2.5 pr-4 px-3 text-gray-800 dark:text-gray-200 font-mono">
                {row.lsb}
              </td>
              <td className="py-2.5 pr-4 px-3 text-gray-800 dark:text-gray-200 font-mono">
                {row.dct}
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    row.better === "LSB"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
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
