'use client'

import { useLoadingContext } from '@/context/LoadingContext'
import { useEffect, useRef, useState } from 'react'

export default function ProcessingOverlay() {
  const { loadingState } = useLoadingContext()
  const { isLoading, statusMessage } = loadingState

  // Progress animation state
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      setVisible(true)

      // Animate to 85% over ~8 seconds using small increments
      let current = 0
      intervalRef.current = setInterval(() => {
        current += (85 - current) * 0.04 // asymptotic approach to 85
        setProgress(Math.min(current, 85))
      }, 200)
    } else if (visible) {
      // Jump to 100% then fade out
      if (intervalRef.current) clearInterval(intervalRef.current)
      setProgress(100)
      timeoutRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 600)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
      aria-live="polite"
      aria-label="Processing"
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-200/50 dark:bg-gray-800/50 w-full">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status message bar */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-1.5 flex items-center gap-3">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 dark:bg-blue-400" />
        </span>

        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 tracking-tight">
          {statusMessage}
        </span>

        <span className="ml-auto font-mono text-xs text-gray-400 dark:text-gray-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
