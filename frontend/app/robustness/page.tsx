"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import BERLineChart, { PSNRLineChart } from "@/components/metrics/BERLineChart"
import { runRobustnessTest } from "@/lib/api"
import type { RobustnessResponse, RobustnessResult } from "@/lib/types"

const DEFAULT_QF = [90, 75, 60, 50, 30]

const PRESETS: Array<{ label: string; value: number }> = [
  { label: "WhatsApp (~70)", value: 70 },
  { label: "Instagram (~85)", value: 85 },
  { label: "Email attachment (~60)", value: 60 },
]

const QUALITY_CONTEXT: Record<number, string> = {
  90: "High-quality social media upload",
  75: "Standard web distribution",
  60: "Nigerian mobile messaging",
  50: "Low-bandwidth mobile messaging",
  30: "Stress test",
}

export default function RobustnessPage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [selectedQF, setSelectedQF] = useState<number[]>([...DEFAULT_QF])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RobustnessResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleQF = (qf: number) => {
    setSelectedQF((prev) =>
      prev.includes(qf) ? prev.filter((v) => v !== qf) : [...prev, qf]
    )
  }

  const addPreset = (qf: number) => {
    if (!selectedQF.includes(qf)) {
      setSelectedQF((prev) => [...prev, qf].sort((a, b) => a - b))
    }
  }

  const handleRun = async () => {
    if (!file || !token.trim() || selectedQF.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const qfStr = selectedQF.join(",")
      const res = await runRobustnessTest(file, token, qfStr)
      setResult(res)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Robustness test failed."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const sortedResults = result
    ? [...result.results].sort(
        (a, b) => b.quality_factor - a.quality_factor
      )
    : []

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Robustness Testing Lab
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

              {/* Quality Factor Checkboxes */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  JPEG Quality Factors
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_QF.map((qf) => (
                    <label
                      key={qf}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        selectedQF.includes(qf)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQF.includes(qf)}
                        onChange={() => toggleQF(qf)}
                        className="accent-blue-600"
                      />
                      {qf}
                    </label>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">
                  Mobile Platform Presets
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => addPreset(preset.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRun}
                disabled={!file || !token.trim() || selectedQF.length === 0 || loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Testing..." : "Run Robustness Test"}
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
            {/* BER Chart */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                BER vs JPEG Quality Factor
              </h2>
              <BERLineChart data={result.results} />
            </section>

            {/* PSNR Chart */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Post-Compression PSNR
              </h2>
              <PSNRLineChart data={result.results} />
            </section>

            {/* Results Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Detailed Results
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-3 font-medium text-slate-600">
                        QF
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-slate-600">
                        Context
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-blue-600">
                        LSB BER
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-blue-600">
                        LSB PSNR
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-orange-600">
                        DCT BER
                      </th>
                      <th className="text-left py-2 font-medium text-orange-600">
                        DCT PSNR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r: RobustnessResult) => (
                      <tr
                        key={r.quality_factor}
                        className="border-b border-slate-100"
                      >
                        <td className="py-2 pr-3 font-medium text-slate-800">
                          {r.quality_factor}
                        </td>
                        <td className="py-2 pr-3 text-slate-600 text-xs">
                          {QUALITY_CONTEXT[r.quality_factor] || r.context}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`font-mono text-sm ${
                              r.lsb.ber === 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {r.lsb.ber.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 font-mono text-sm text-slate-800">
                          {r.lsb.post_compression_psnr.toFixed(2)}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`font-mono text-sm ${
                              r.dct.ber === 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {r.dct.ber.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-sm text-slate-800">
                          {r.dct.post_compression_psnr.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Verdict Panel */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Robustness Verdict
              </h2>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                    LSB Survival
                  </p>
                  <p className="text-sm text-slate-700">
                    {result.lsb_survival_quality_factors.length > 0
                      ? `LSB token survives at quality factors: ${result.lsb_survival_quality_factors.join(", ")}`
                      : "LSB token does not survive JPEG compression at any tested quality level."}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">
                    DCT Survival
                  </p>
                  <p className="text-sm text-slate-700">
                    {result.dct_survival_quality_factors.length > 0
                      ? `DCT token survives at quality factors: ${result.dct_survival_quality_factors.join(", ")}`
                      : "DCT token does not survive JPEG compression at any tested quality level."}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                    Recommendation for Nigerian Digital Media
                  </p>
                  <p className="text-sm text-slate-700">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
