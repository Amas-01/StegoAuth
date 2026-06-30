"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import MetricsCard from "@/components/metrics/MetricsCard"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import { embedLsb, embedDct, extractLsb, extractDct } from "@/lib/api"
import { useLoadingContext } from "@/context/LoadingContext"
import type { EmbedResponse, ExtractResponse } from "@/lib/types"
import { CheckCircle2, XCircle, Download, Loader2 } from "lucide-react"

type Technique = "LSB" | "DCT"

export default function EmbedPage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [technique, setTechnique] = useState<Technique>("LSB")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmbedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [extractFile, setExtractFile] = useState<File | null>(null)
  const [extractLoading, setExtractLoading] = useState(false)
  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)

  const { startLoading, stopLoading } = useLoadingContext()

  const handleEmbed = async () => {
    if (!file || !token.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const endpoint = technique === "LSB" ? "/embed/lsb" : "/embed/dct"
    startLoading(endpoint)
    try {
      const fn = technique === "LSB" ? embedLsb : embedDct
      const res = await fn(file, token)
      setResult(res)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Embedding failed. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  const handleExtract = async () => {
    if (!extractFile) return
    setExtractLoading(true)
    setExtractError(null)
    setExtractResult(null)
    const endpoint = technique === "LSB" ? "/extract/lsb" : "/extract/dct"
    startLoading(endpoint)
    try {
      const fn = technique === "LSB" ? extractLsb : extractDct
      const res = await fn(extractFile)
      setExtractResult(res)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Extraction failed."
      setExtractError(msg)
    } finally {
      setExtractLoading(false)
      stopLoading()
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${result.stego_image_b64}`
    link.download = `stego_${technique.toLowerCase()}.png`
    link.click()
  }

  const psnrBadge = (psnr: number) => {
    if (psnr >= 40) return { text: "IMPERCEPTIBLE (>40dB)", color: "green" as const }
    return { text: "VISIBLE (<40dB)", color: "red" as const }
  }

  const ssimBadge = (ssim: number) => {
    if (ssim >= 0.98) return { text: "HIGH FIDELITY (>0.98)", color: "green" as const }
    return { text: "DEGRADED", color: "yellow" as const }
  }

  const tokenMatch =
    extractResult &&
    extractResult.extracted_token.trim() === result?.sanitised_token.trim()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <PageTransition>
          <AnimatedSection delay={0}>
            <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">
              Embed Authentication Token
            </h1>
          </AnimatedSection>

          {/* Input Panel */}
          <AnimatedSection delay={0.1}>
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Cover Image
                  </p>
                  {file ? (
                    <ImagePreview file={file} onClear={() => setFile(null)} />
                  ) : (
                    <DropZone onFileSelect={setFile} />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Authentication Token
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value.slice(0, 64))}
                      placeholder="AUTH-2025-[YOUR-TOKEN-HERE]"
                      className="
                        w-full px-4 py-3
                        bg-white dark:bg-gray-800
                        border border-gray-300 dark:border-gray-600
                        rounded-xl
                        text-gray-900 dark:text-gray-100
                        font-mono text-sm
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        transition-all duration-200
                      "
                      maxLength={64}
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                      {token.length}/64 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      Technique
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                        <input
                          type="radio"
                          name="technique"
                          checked={technique === "LSB"}
                          onChange={() => setTechnique("LSB")}
                          className="accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            LSB — Spatial Domain
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Recommended for high capacity, not compression-resistant
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors">
                        <input
                          type="radio"
                          name="technique"
                          checked={technique === "DCT"}
                          onChange={() => setTechnique("DCT")}
                          className="accent-orange-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            DCT — Frequency Domain
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Recommended for JPEG distribution channels
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    id="embed-btn"
                    onClick={handleEmbed}
                    disabled={!file || !token.trim() || loading}
                    className="
                      inline-flex items-center justify-center gap-2 w-full
                      px-6 py-3
                      bg-blue-600 hover:bg-blue-700
                      dark:bg-blue-500 dark:hover:bg-blue-600
                      text-white font-medium
                      rounded-xl
                      shadow-sm hover:shadow-blue-500/20 hover:shadow-md
                      transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    "
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Embedding...
                      </>
                    ) : (
                      "Embed Authentication Token"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Output Panel */}
          {result && (
            <>
              <AnimatedSection delay={0}>
                {/* Side-by-side images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Original Image
                    </p>
                    <img
                      src={`data:image/png;base64,${result.stego_image_b64}`}
                      alt="Stego"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                      {result.image_dimensions[0]}×{result.image_dimensions[1]} px
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stego Image ({technique})
                      </p>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download (PNG)
                      </button>
                    </div>
                    <img
                      src={`data:image/png;base64,${result.stego_image_b64}`}
                      alt="Stego"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                {/* Heatmap */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-8">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pixel Difference Heatmap
                  </p>
                  <img
                    src={`data:image/png;base64,${result.heatmap_b64}`}
                    alt="Heatmap"
                    className="max-w-md rounded-xl border border-gray-200 dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                    Black = no change · Red = modification
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  <MetricsCard
                    label="MSE"
                    value={result.metrics.mse.toFixed(4)}
                    description="Lower is better"
                  />
                  <MetricsCard
                    label="PSNR"
                    value={`${result.metrics.psnr.toFixed(2)} dB`}
                    description="Higher is better"
                    badge={psnrBadge(result.metrics.psnr)}
                  />
                  <MetricsCard
                    label="SSIM"
                    value={result.metrics.ssim.toFixed(6)}
                    description="Max 1.0"
                    badge={ssimBadge(result.metrics.ssim)}
                  />
                  <MetricsCard
                    label="Capacity"
                    value={`${result.metrics.capacity_bits.toLocaleString()} bits`}
                    description={`${result.metrics.capacity_bytes.toLocaleString()} bytes`}
                  />
                  <MetricsCard
                    label="Processing Time"
                    value={`${result.metrics.processing_time_ms.toFixed(1)} ms`}
                    description="Lower is better"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                {/* Extraction Verification */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-8">
                  <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Extraction Verification
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Stego Image for Extraction
                      </p>
                      {extractFile ? (
                        <ImagePreview
                          file={extractFile}
                          onClear={() => {
                            setExtractFile(null)
                            setExtractResult(null)
                          }}
                        />
                      ) : (
                        <DropZone
                          onFileSelect={setExtractFile}
                          label="Drop stego image here"
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        id="extract-btn"
                        onClick={handleExtract}
                        disabled={!extractFile || extractLoading}
                        className="
                          inline-flex items-center justify-center gap-2 w-full
                          px-6 py-3
                          bg-emerald-600 hover:bg-emerald-700
                          dark:bg-emerald-500 dark:hover:bg-emerald-600
                          text-white font-medium
                          rounded-xl shadow-sm hover:shadow-emerald-500/20 hover:shadow-md
                          transition-all duration-300
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        {extractLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          "Extract Token"
                        )}
                      </button>

                      {extractError && (
                        <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-800">
                          {extractError}
                        </div>
                      )}

                      {extractResult && (
                        <div className="mt-3 space-y-2">
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Extracted Token
                            </p>
                            <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                              {extractResult.extracted_token}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {tokenMatch ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                  TOKEN VERIFIED &mdash; Extraction successful
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                  TOKEN MISMATCH
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </>
          )}
        </PageTransition>
      </main>

      <Footer />
    </div>
  )
}
