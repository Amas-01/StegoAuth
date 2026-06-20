"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import MetricsCard from "@/components/metrics/MetricsCard"
import { embedLsb, embedDct, extractLsb, extractDct } from "@/lib/api"
import type { EmbedResponse, ExtractResponse } from "@/lib/types"
import { CheckCircle2, XCircle, Download } from "lucide-react"

type Technique = "LSB" | "DCT"

export default function EmbedPage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [technique, setTechnique] = useState<Technique>("LSB")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmbedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Extraction verification
  const [extractFile, setExtractFile] = useState<File | null>(null)
  const [extractLoading, setExtractLoading] = useState(false)
  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(
    null
  )
  const [extractError, setExtractError] = useState<string | null>(null)

  const handleEmbed = async () => {
    if (!file || !token.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
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
    }
  }

  const handleExtract = async () => {
    if (!extractFile) return
    setExtractLoading(true)
    setExtractError(null)
    setExtractResult(null)
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Embed Authentication Token</h1>

        {/* Input Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
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
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Authentication Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.slice(0, 64))}
                  placeholder="AUTH-2025-[YOUR-TOKEN-HERE]"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={64}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {token.length}/64 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Technique
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                    <input
                      type="radio"
                      name="technique"
                      checked={technique === "LSB"}
                      onChange={() => setTechnique("LSB")}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        LSB — Spatial Domain
                      </p>
                      <p className="text-xs text-slate-400">
                        Recommended for high capacity, not compression-resistant
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-orange-50/50">
                    <input
                      type="radio"
                      name="technique"
                      checked={technique === "DCT"}
                      onChange={() => setTechnique("DCT")}
                      className="accent-orange-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        DCT — Frequency Domain
                      </p>
                      <p className="text-xs text-slate-400">
                        Recommended for JPEG distribution channels
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleEmbed}
                disabled={!file || !token.trim() || loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Embedding..." : "Embed Authentication Token"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Output Panel */}
        {result && (
          <>
            {/* Side-by-side images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Original Image
                </p>
                <img
                  src={`data:image/png;base64,${result.stego_image_b64}`}
                  alt="Stego"
                  className="w-full rounded-lg border border-slate-200"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {result.image_dimensions[0]}×{result.image_dimensions[1]} px
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">
                    Stego Image ({technique})
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Download (PNG)
                  </button>
                </div>
                <img
                  src={`data:image/png;base64,${result.stego_image_b64}`}
                  alt="Stego"
                  className="w-full rounded-lg border border-slate-200"
                />
              </div>
            </div>

            {/* Heatmap */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Pixel Difference Heatmap
              </p>
              <img
                src={`data:image/png;base64,${result.heatmap_b64}`}
                alt="Heatmap"
                className="max-w-md rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-400 mt-1">
                Black = no change, Red = modification
              </p>
            </div>

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

            {/* Extraction Verification */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Extraction Verification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
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
                    onClick={handleExtract}
                    disabled={!extractFile || extractLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {extractLoading ? "Extracting..." : "Extract Token"}
                  </button>

                  {extractError && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {extractError}
                    </div>
                  )}

                  {extractResult && (
                    <div className="mt-3 space-y-2">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">
                          Extracted Token
                        </p>
                        <p className="text-sm font-mono text-slate-800 break-all">
                          {extractResult.extracted_token}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tokenMatch ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                              TOKEN VERIFIED &mdash; Extraction successful
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-700">
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
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
