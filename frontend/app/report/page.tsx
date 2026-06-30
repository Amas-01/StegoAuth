"use client"

import { useState, useCallback } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import { embedDct, extractDct, generateReport, compareTechniques, runRobustnessTest } from "@/lib/api"
import { useLoadingContext } from "@/context/LoadingContext"
import type { EmbedResponse, CompareResponse, RobustnessResponse } from "@/lib/types"
import { CheckCircle2, XCircle, Download, FileText, Loader2 } from "lucide-react"

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function ReportPage() {
  const [authFile, setAuthFile] = useState<File | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authResult, setAuthResult] = useState<EmbedResponse | null>(null)
  const [authHash, setAuthHash] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const [verifyFile, setVerifyFile] = useState<File | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [verifyMatch, setVerifyMatch] = useState<boolean | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [reportLoading, setReportLoading] = useState(false)
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [robustnessData, setRobustnessData] = useState<RobustnessResponse | null>(null)

  const { startLoading, stopLoading } = useLoadingContext()

  const cardCls = "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6"
  const btnBlue = "inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm hover:shadow-blue-500/20 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
  const btnEmerald = "inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium rounded-xl shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"

  const handleAuthenticate = useCallback(async () => {
    if (!authFile) return
    setAuthLoading(true); setAuthError(null); setAuthResult(null); setAuthHash(null)
    setCompareData(null); setRobustnessData(null)
    startLoading("/embed/dct")
    try {
      const buffer = await authFile.arrayBuffer()
      const hash = await sha256(buffer)
      const res = await embedDct(authFile, hash)
      setAuthResult(res); setAuthHash(hash)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.")
    } finally {
      setAuthLoading(false); stopLoading()
    }
  }, [authFile, startLoading, stopLoading])

  const handleVerify = useCallback(async () => {
    if (!verifyFile || !authHash) return
    setVerifyLoading(true); setVerifyError(null); setVerifyToken(null); setVerifyMatch(null)
    startLoading("/extract/dct")
    try {
      const res = await extractDct(verifyFile)
      setVerifyToken(res.extracted_token)
      setVerifyMatch(res.extracted_token.trim() === authHash)
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed.")
    } finally {
      setVerifyLoading(false); stopLoading()
    }
  }, [verifyFile, authHash, startLoading, stopLoading])

  const handleDownload = () => {
    if (!authResult) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${authResult.stego_image_b64}`
    link.download = "authenticated_image.png"
    link.click()
  }

  const handleGenerateReport = async () => {
    if (!authResult || !authHash) return
    setReportLoading(true)
    startLoading("/report/generate")
    try {
      let cmp = compareData
      let rob = robustnessData
      if (!cmp) { cmp = await compareTechniques(authFile!, authHash); setCompareData(cmp) }
      if (!rob) { rob = await runRobustnessTest(authFile!, authHash); setRobustnessData(rob) }
      const payload = {
        original_b64: cmp.original_b64, lsb_stego_b64: cmp.lsb_stego_b64, dct_stego_b64: cmp.dct_stego_b64,
        lsb_heatmap_b64: cmp.lsb_heatmap_b64, dct_heatmap_b64: cmp.dct_heatmap_b64,
        lsb_metrics: cmp.lsb_metrics, dct_metrics: cmp.dct_metrics,
        robustness_results: rob.results, verdict: cmp.verdict,
        original_token: authHash, extracted_token: verifyToken || "", token_match: verifyMatch || false,
      }
      const pdfBlob = await generateReport(payload)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `stegoauth_report_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Report generation failed.")
    } finally {
      setReportLoading(false); stopLoading()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <PageTransition>
          <AnimatedSection delay={0}>
            <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">Authentication Demo &amp; Report</h1>
          </AnimatedSection>

          {/* Authentication Demo */}
          <AnimatedSection delay={0.1}>
            <section className={`${cardCls} mb-8`}>
              <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Authentication Demo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image to Authenticate</p>
                  {authFile ? (
                    <ImagePreview file={authFile} onClear={() => { setAuthFile(null); setAuthResult(null); setAuthHash(null) }} />
                  ) : (
                    <DropZone onFileSelect={setAuthFile} />
                  )}
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                    The embedded SHA-256 hash acts as an intrinsic authentication code. Any modification to the image after embedding will alter the pixel values, preventing correct token recovery and flagging the image as tampered.
                  </p>
                  <button id="authenticate-btn" onClick={handleAuthenticate} disabled={!authFile || authLoading} className={btnBlue}>
                    {authLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Computing hash &amp; embedding...</> : "Authenticate Image (DCT)"}
                  </button>
                </div>
              </div>

              {authError && <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 text-sm text-red-700 dark:text-red-400">{authError}</div>}

              {authResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Image</p>
                      <img src={URL.createObjectURL(authFile!)} alt="Original" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Authenticated Stego Image</p>
                        <button onClick={handleDownload} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                          <Download className="w-4 h-4" />Download
                        </button>
                      </div>
                      <img src={`data:image/png;base64,${authResult.stego_image_b64}`} alt="Stego" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Embedded SHA-256 Token</p>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{authHash}</p>
                  </div>
                </div>
              )}
            </section>
          </AnimatedSection>

          {/* Verification */}
          <AnimatedSection delay={0.2}>
            <section className={`${cardCls} mb-8`}>
              <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Verification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Stego Image to Verify</p>
                  {verifyFile ? (
                    <ImagePreview file={verifyFile} onClear={() => { setVerifyFile(null); setVerifyToken(null); setVerifyMatch(null) }} />
                  ) : (
                    <DropZone onFileSelect={setVerifyFile} label="Drop stego image here to verify" />
                  )}
                </div>
                <div className="flex flex-col justify-end">
                  <button id="verify-btn" onClick={handleVerify} disabled={!verifyFile || !authHash || verifyLoading} className={btnEmerald}>
                    {verifyLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : "Verify Authenticity"}
                  </button>
                  {verifyError && <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-800">{verifyError}</div>}
                  {verifyMatch !== null && (
                    <div className={`mt-3 p-4 rounded-xl border ${verifyMatch ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verifyMatch ? (
                          <><CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AUTHENTIC &mdash; Token matches expected hash</span></>
                        ) : (
                          <><XCircle className="w-6 h-6 text-red-600 dark:text-red-400" /><span className="text-sm font-semibold text-red-700 dark:text-red-400">TAMPERED &mdash; Token mismatch or extraction failed</span></>
                        )}
                      </div>
                      {verifyToken && <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-2 mt-2"><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Extracted Token</p><p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{verifyToken}</p></div>}
                      <div className="bg-white/80 dark:bg-gray-800/50 rounded-lg p-2 mt-1"><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Expected Hash</p><p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{authHash}</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* PDF Report Export */}
          <AnimatedSection delay={0.3}>
            <section className={cardCls}>
              <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">PDF Report Export</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate a full analysis report including images, quality metrics, robustness results, and authentication verification. The report will be downloaded as a PDF file.</p>
              <button id="report-btn" onClick={handleGenerateReport} disabled={!authResult || reportLoading} className={`${btnBlue} w-auto`}>
                <FileText className="w-4 h-4" />
                {reportLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Report...</> : "Generate Full Analysis Report"}
              </button>
            </section>
          </AnimatedSection>
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
