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
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import ParticleBackground from "@/components/ui/ParticleBackground"
import { compareTechniques } from "@/lib/api"
import { useLoadingContext } from "@/context/LoadingContext"
import type { CompareResponse } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function ComparePage() {
  const [file, setFile] = useState<File | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { startLoading, stopLoading } = useLoadingContext()

  const handleCompare = async () => {
    if (!file || !token.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    startLoading("/compare")
    try {
      const res = await compareTechniques(file, token)
      setResult(res)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Comparison failed."
      setError(msg)
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10">
      <Navbar />

      <div className="relative flex-1">
        <ParticleBackground />

        <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <PageTransition>
            <AnimatedSection delay={0}>
              <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">
                Comparative Analysis
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

                  <div className="space-y-4 flex flex-col justify-end">
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

                    <button
                      id="compare-btn"
                      onClick={handleCompare}
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
                          Processing...
                        </>
                      ) : (
                        "Run Comparative Analysis"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-8">
                <AnimatedSection delay={0}>
                  <section>
                    <h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
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
                </AnimatedSection>

                <AnimatedSection delay={0.1}>
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
                </AnimatedSection>

                <AnimatedSection delay={0.2}>
                  <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Metrics Comparison
                    </h2>
                    <MetricsTable
                      lsb={result.lsb_metrics}
                      dct={result.dct_metrics}
                    />
                  </section>
                </AnimatedSection>

                <AnimatedSection delay={0.3}>
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
                </AnimatedSection>

                <AnimatedSection delay={0.4}>
                  <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Heatmap Comparison
                    </h2>
                    <HeatmapDisplay
                      lsbB64={result.lsb_heatmap_b64}
                      dctB64={result.dct_heatmap_b64}
                    />
                  </section>
                </AnimatedSection>

                <AnimatedSection delay={0.5}>
                  <section>
                    <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Analysis Summary
                    </h2>
                    <VerdictPanel verdict={result.verdict} />
                  </section>
                </AnimatedSection>
              </div>
            )}
          </PageTransition>
        </main>
      </div>

      <Footer />
    </div>
  )
}
