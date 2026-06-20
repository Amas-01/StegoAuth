interface MetricsCardProps {
  label: string
  value: string | number
  description: string
  badge?: {
    text: string
    color: "green" | "yellow" | "red"
  }
}

export default function MetricsCard({
  label,
  value,
  description,
  badge,
}: MetricsCardProps) {
  const badgeColors: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    red: "bg-red-100 text-red-700 border-red-200",
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${badgeColors[badge.color]}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  )
}
