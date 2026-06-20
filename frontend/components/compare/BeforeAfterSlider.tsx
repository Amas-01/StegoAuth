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
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700 mb-3 text-center">
        {beforeLabel} vs {afterLabel}
      </p>
      <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-lg border border-slate-200 select-none">
        <img
          src={`data:image/png;base64,${afterB64}`}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
        />
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
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute bottom-2 left-2 right-2 z-10 w-[calc(100%-16px)] accent-blue-600"
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm pointer-events-none z-10"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  )
}
