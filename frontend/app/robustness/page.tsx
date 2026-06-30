"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import BERLineChart, { PSNRLineChart } from "@/components/metrics/BERLineChart"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import { runRobustnessTest } from "@/lib/api"
import { useLoadingContext } from "@/context/LoadingContext"
import type { RobustnessResponse, RobustnessResult } from "@/lib/types"
import { Loader2 } from "lucide-react"

const DEFAULT_QF = [90, 75, 60, 50, 30]
const PRESETS = [
  { label: "WhatsApp (~70)", value: 70 },
  { label: "Instagram (~85)", value: 85 },
  { label: "Email (~60)", value: 60 },
]
const QUALITY_CONTEXT: Record<number, string> = {
  90: "High-quality social media",
  75: "Standard web distribution",
  60: "Nigerian mobile messaging",
  50: "Low-bandwidth messaging",
  30: "Stress test",
}

export default function RobustnessPage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [selectedQF, setSelectedQF] = useState<number[]>([...DEFAULT_QF])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RobustnessResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoadingContext()

  const toggleQF = (qf: number) =>
    setSelectedQF((prev) => prev.includes(qf) ? prev.filter((v) => v !== qf) : [...prev, qf])

  const addPreset = (qf: number) => {
    if (!selectedQF.includes(qf))
      setSelectedQF((prev) => [...prev, qf].sort((a, b) => a - b))
  }

  const handleRun = async () => {
    if (!file || !token.trim() || selectedQF.length === 0) return
    setLoading(true); setError(null); setResult(null)
    startLoading("/robustness")
    try {
      const res = await runRobustnessTest(file, token, selectedQF.join(","))
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Robustness test failed.")
    } finally {
      setLoading(false); stopLoading()
    }
  }

  const sorted = result ? [...result.results].sort((a, b) => b.quality_factor - a.quality_factor) : []
  const inputCls = "w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
  const cardCls = "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm"
  const btnCls = "inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm hover:shadow-blue-500/20 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <PageTransition>
          <AnimatedSection delay={0}>
            <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">Robustness Testing Lab</h1>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className={`${cardCls} p-6 mb-8`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Cover Image</p>
                  {file ? <ImagePreview file={file} onClear={() => setFile(null)} /> : <DropZone onFileSelect={setFile} />}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Authentication Token</label>
                    <input type="text" value={token} onChange={(e) => setToken(e.target.value.slice(0, 64))} placeholder="AUTH-2025-[YOUR-TOKEN-HERE]" className={inputCls} maxLength={64} />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{token.length}/64 characters</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JPEG Quality Factors</p>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_QF.map((qf) => (
                        <label key={qf} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${selectedQF.includes(qf) ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          <input type="checkbox" checked={selectedQF.includes(qf)} onChange={() => toggleQF(qf)} className="accent-blue-600" />
                          <span className="font-mono">{qf}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Mobile Platform Presets</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <button key={p.label} onClick={() => addPreset(p.value)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 transition-colors">{p.label}</button>
                      ))}
                    </div>
                  </div>
                  <button id="robustness-btn" onClick={handleRun} disabled={!file || !token.trim() || selectedQF.length === 0 || loading} className={btnCls}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Testing...</> : "Run Robustness Test"}
                  </button>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {error && <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-sm text-red-700 dark:text-red-400">{error}</div>}

          {result && (
            <div className="space-y-8">
              <AnimatedSection delay={0}><section><h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">BER vs JPEG Quality Factor</h2><BERLineChart data={result.results} /></section></AnimatedSection>
              <AnimatedSection delay={0.1}><section><h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Post-Compression PSNR</h2><PSNRLineChart data={result.results} /></section></AnimatedSection>

              <AnimatedSection delay={0.2}>
                <section className={`${cardCls} p-6`}>
                  <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Detailed Results</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          {["QF", "Context", "LSB BER", "LSB PSNR", "DCT BER", "DCT PSNR"].map((h, i) => (
                            <th key={h} className={`text-left py-2.5 px-3 font-medium bg-gray-50 dark:bg-gray-800/50 ${i < 2 ? "text-gray-500 dark:text-gray-400" : i < 4 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((r: RobustnessResult) => (
                          <tr key={r.quality_factor} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-2.5 px-3 font-medium font-mono text-gray-800 dark:text-gray-200">{r.quality_factor}</td>
                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">{QUALITY_CONTEXT[r.quality_factor] || r.context}</td>
                            <td className="py-2.5 px-3"><span className={`font-mono text-sm ${r.lsb.ber === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{r.lsb.ber.toFixed(4)}</span></td>
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-800 dark:text-gray-200">{r.lsb.post_compression_psnr.toFixed(2)}</td>
                            <td className="py-2.5 px-3"><span className={`font-mono text-sm ${r.dct.ber === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{r.dct.ber.toFixed(4)}</span></td>
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-800 dark:text-gray-200">{r.dct.post_compression_psnr.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <section className={`${cardCls} p-6`}>
                  <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Robustness Verdict</h2>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">LSB Survival</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.lsb_survival_quality_factors.length > 0 ? `LSB token survives at quality factors: ${result.lsb_survival_quality_factors.join(", ")}` : "LSB token does not survive JPEG compression at any tested quality level."}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                      <p className="text-xs font-mono font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">DCT Survival</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.dct_survival_quality_factors.length > 0 ? `DCT token survives at quality factors: ${result.dct_survival_quality_factors.join(", ")}` : "DCT token does not survive JPEG compression at any tested quality level."}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                      <p className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Recommendation</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.recommendation}</p>
                    </div>
                  </div>
                </section>
              </AnimatedSection>
            </div>
          )}
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
