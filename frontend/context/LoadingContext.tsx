'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingState {
  isLoading: boolean
  statusMessage: string
  endpoint: string
}

interface LoadingContextValue {
  loadingState: LoadingState
  startLoading: (endpoint: string) => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

const STATUS_MESSAGES: Record<string, string[]> = {
  '/embed/lsb': [
    'Loading image...',
    'Building payload bits...',
    'Embedding LSB data...',
  ],
  '/embed/dct': [
    'Loading image...',
    'Converting to YCbCr...',
    'Applying DCT to 8×8 blocks...',
    'Running IDCT...',
  ],
  '/compare': [
    'Processing LSB embedding...',
    'Processing DCT embedding...',
    'Computing PSNR, SSIM, MSE...',
    'Generating heatmaps...',
  ],
  '/robustness': [
    'Embedding tokens...',
    'Testing JPEG quality 90...',
    'Testing JPEG quality 75...',
    'Testing JPEG quality 60...',
    'Testing JPEG quality 50...',
    'Testing JPEG quality 30...',
    'Computing BER values...',
  ],
  '/extract/lsb': [
    'Reading stego image...',
    'Extracting payload bits...',
    'Decoding authentication token...',
  ],
  '/extract/dct': [
    'Reading stego image...',
    'Extracting payload bits...',
    'Decoding authentication token...',
  ],
  '/report/generate': [
    'Compiling results...',
    'Assembling PDF report...',
  ],
  default: [
    'Processing...',
    'Please wait...',
  ],
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    statusMessage: '',
    endpoint: '',
  })

  const startLoading = useCallback((endpoint: string) => {
    const messages = STATUS_MESSAGES[endpoint] || STATUS_MESSAGES['default']
    setLoadingState({ isLoading: true, statusMessage: messages[0], endpoint })

    let index = 0
    const interval = setInterval(() => {
      index = Math.min(index + 1, messages.length - 1)
      setLoadingState((prev) => ({
        ...prev,
        statusMessage: messages[index],
      }))
      if (index >= messages.length - 1) clearInterval(interval)
    }, 2200)

    // Store interval ID on the state so stopLoading can clear it
    ;(window as unknown as Record<string, ReturnType<typeof setInterval>>)['__stegoLoadingInterval'] = interval
  }, [])

  const stopLoading = useCallback(() => {
    const id = (window as unknown as Record<string, ReturnType<typeof setInterval>>)['__stegoLoadingInterval']
    if (id) clearInterval(id)
    setLoadingState({ isLoading: false, statusMessage: '', endpoint: '' })
  }, [])

  return (
    <LoadingContext.Provider value={{ loadingState, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingContext(): LoadingContextValue {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoadingContext must be used inside LoadingProvider')
  return ctx
}
