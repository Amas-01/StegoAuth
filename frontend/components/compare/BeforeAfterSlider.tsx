"use client"

import { useState } from "react"

interface BeforeAfterSliderProps {
  beforeB64: string
  afterB64: string
  beforeLabel: string
  afterLabel: string
}

export default function BeforeAfterSlider({
  beforeB64,
  afterB64,
  beforeLabel,
  afterLabel,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
        {beforeLabel} <span className="text-gray-400 dark:text-gray-600 mx-1">vs</span> {afterLabel}
      </p>

      <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 select-none">
        {/* After image (full width beneath) */}
        <img
          src={`data:image/png;base64,${afterB64}`}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
        />
        {/* Before image clipped to position% */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={`data:image/png;base64,${beforeB64}`}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 dark:bg-white/80 shadow-lg pointer-events-none z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          {/* Custom handle */}
          <div
            className="
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-9 h-9 rounded-full
              bg-blue-600 dark:bg-blue-500
              border-2 border-white dark:border-gray-900
              shadow-lg shadow-blue-500/40
              ring-2 ring-blue-400/30
              flex items-center justify-center
              pointer-events-none
            "
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
              <path d="M9 18l6-6-6-6" transform="translate(6,0)" />
            </svg>
          </div>
        </div>

        {/* Invisible range input on top */}
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full z-20 opacity-0 cursor-ew-resize"
          aria-label={`Drag to compare ${beforeLabel} and ${afterLabel}`}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  )
}
