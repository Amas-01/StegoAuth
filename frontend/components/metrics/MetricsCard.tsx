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
    green:
      "px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    yellow:
      "px-2 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red:
      "px-2 py-0.5 rounded-full text-xs font-mono bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div
      className="
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-md
        border border-gray-200 dark:border-gray-800
        rounded-2xl
        shadow-sm hover:shadow-md
        transition-all duration-300
        hover:scale-[1.02]
        hover:border-blue-400/50 dark:hover:border-blue-500/50
        hover:ring-1 hover:ring-blue-400/30 dark:hover:ring-blue-500/30
        p-4
      "
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {badge && (
          <span className={badgeColors[badge.color]}>{badge.text}</span>
        )}
      </div>
      <p className="font-mono text-2xl font-semibold text-blue-500 dark:text-blue-400 mb-1">
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  )
}
