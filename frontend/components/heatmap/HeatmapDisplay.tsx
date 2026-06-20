interface HeatmapDisplayProps {
  lsbB64: string
  dctB64: string
}

export default function HeatmapDisplay({
  lsbB64,
  dctB64,
}: HeatmapDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700 mb-2 text-center">
          LSB Difference Map
        </p>
        <img
          src={`data:image/png;base64,${lsbB64}`}
          alt="LSB Heatmap"
          className="w-full rounded border border-slate-100"
        />
        <p className="text-xs text-slate-400 mt-1 text-center">
          Black = no change, Red = modification
        </p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700 mb-2 text-center">
          DCT Difference Map
        </p>
        <img
          src={`data:image/png;base64,${dctB64}`}
          alt="DCT Heatmap"
          className="w-full rounded border border-slate-100"
        />
        <p className="text-xs text-slate-400 mt-1 text-center">
          Black = no change, Red = modification
        </p>
      </div>
    </div>
  )
}
