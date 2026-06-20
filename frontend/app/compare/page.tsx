"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import ThreeColumnView from "@/components/compare/ThreeColumnView"
import BeforeAfterSlider from "@/components/compare/BeforeAfterSlider"
import MetricsTable from "@/components/metrics/MetricsTable"
import PSNRBarChart, { SSIMBarChart } from "@/components/metrics/PSNRBarChart"
import HeatmapDisplay from "@/components/heatmap/HeatmapDisplay"
import VerdictPanel from "@/components/verdict/VerdictPanel"
import { compareTechniques } from "@/lib/api"
import type { CompareResponse } from "@/lib/types"

export default function ComparePage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!file || !token.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await compareTechniques(file, token)
      setResult(res)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Comparison failed."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Comparative Analysis
        </h1>

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

            <div className="space-y-4 flex flex-col justify-end">
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

              <button
                onClick={handleCompare}
                disabled={!file || !token.trim() || loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Running Analysis..." : "Run Comparative Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Three-Column Image View */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Image Comparison
              </h2>
              <ThreeColumnView
                originalB64={result.original_b64}
                lsbB64={result.lsb_stego_b64}
                dctB64={result.dct_stego_b64}
                lsbPsnr={result.lsb_metrics.psnr}
                dctPsnr={result.dct_metrics.psnr}
              />
            </section>

            {/* Before/After Sliders */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BeforeAfterSlider
                beforeB64={result.original_b64}
                afterB64={result.lsb_stego_b64}
                beforeLabel="Original"
                afterLabel="LSB Stego"
              />
              <BeforeAfterSlider
                beforeB64={result.original_b64}
                afterB64={result.dct_stego_b64}
                beforeLabel="Original"
                afterLabel="DCT Stego"
              />
            </section>

            {/* Metrics Comparison Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Metrics Comparison
              </h2>
              <MetricsTable
                lsb={result.lsb_metrics}
                dct={result.dct_metrics}
              />
            </section>

            {/* Bar Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PSNRBarChart
                lsbPsnr={result.lsb_metrics.psnr}
                dctPsnr={result.dct_metrics.psnr}
              />
              <SSIMBarChart
                lsbSsim={result.lsb_metrics.ssim}
                dctSsim={result.dct_metrics.ssim}
              />
            </section>

            {/* Heatmap Comparison */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Heatmap Comparison
              </h2>
              <HeatmapDisplay
                lsbB64={result.lsb_heatmap_b64}
                dctB64={result.dct_heatmap_b64}
              />
            </section>

            {/* Verdict Panel */}
            <section>
              <VerdictPanel verdict={result.verdict} />
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
