"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import { embedDct, extractDct, generateReport, compareTechniques, runRobustnessTest, saveAuthRecord, getAuthRecords, lookupAuthRecord } from "@/lib/api"
import { useLoadingContext } from "@/context/LoadingContext"
import type { EmbedResponse, CompareResponse, RobustnessResponse, AuthRecord } from "@/lib/types"
import { CheckCircle2, XCircle, Download, FileText, Loader2, History } from "lucide-react"

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = localStorage.getItem("stegoauth_session")
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem("stegoauth_session", sid)
  }
  return sid
}

function base64ToBlob(b64: string, mimeType: string = "image/png"): Blob {
  const byteChars = atob(b64)
  const byteArrays: BlobPart[] = []
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i)
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, { type: mimeType })
}

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
  const [authRecords, setAuthRecords] = useState<AuthRecord[]>([])
  const [verifyHistory, setVerifyHistory] = useState<AuthRecord | null>(null)

  const { startLoading, stopLoading } = useLoadingContext()
  const sessionIdRef = useRef("")

  useEffect(() => {
    sessionIdRef.current = getSessionId()
    getAuthRecords(sessionIdRef.current).then((res) => setAuthRecords(res.records)).catch(() => {})
  }, [])

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
      const sid = sessionIdRef.current || getSessionId()
      sessionIdRef.current = sid
      await saveAuthRecord(sid, hash, authFile.name)
      const records = await getAuthRecords(sid)
      setAuthRecords(records.records)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.")
    } finally {
      setAuthLoading(false); stopLoading()
    }
  }, [authFile, startLoading, stopLoading])

  const handleVerify = useCallback(async () => {
    if (!verifyFile || !authHash) return
    setVerifyLoading(true); setVerifyError(null); setVerifyToken(null); setVerifyMatch(null); setVerifyHistory(null)
    startLoading("/extract/dct")
    try {
      const res = await extractDct(verifyFile)
      setVerifyToken(res.extracted_token)
      setVerifyMatch(res.extracted_token.trim() === authHash)
      const lr = await lookupAuthRecord(res.extracted_token.trim())
      if (lr.found) setVerifyHistory(lr.record)
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
      let reportToken = verifyToken
      let reportMatch: boolean | null = verifyMatch
      if (reportToken === null && cmp.dct_stego_b64) {
        const blob = base64ToBlob(cmp.dct_stego_b64)
        const file = new File([blob], "stego_dct.png", { type: "image/png" })
        const extRes = await extractDct(file)
        reportToken = extRes.extracted_token
        reportMatch = extRes.extracted_token.trim() === authHash
      }
      const payload: Record<string, unknown> = {
        original_b64: cmp.original_b64, lsb_stego_b64: cmp.lsb_stego_b64, dct_stego_b64: cmp.dct_stego_b64,
        lsb_heatmap_b64: cmp.lsb_heatmap_b64, dct_heatmap_b64: cmp.dct_heatmap_b64,
        lsb_metrics: cmp.lsb_metrics, dct_metrics: cmp.dct_metrics,
        robustness_results: rob.results, verdict: cmp.verdict,
        original_token: authHash, extracted_token: reportToken || "", token_match: reportMatch,
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
                    <ImagePreview file={verifyFile} onClear={() => { setVerifyFile(null); setVerifyToken(null); setVerifyMatch(null); setVerifyHistory(null) }} />
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
                      {verifyHistory && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 mt-2 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Previously authenticated</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">File: {verifyHistory.original_filename || "unknown"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Date: {new Date(verifyHistory.created_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Auth History */}
          <AnimatedSection delay={0.3}>
            <section className={`${cardCls} mb-8`}>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="font-heading text-lg font-semibold text-gray-800 dark:text-gray-100">Authentication History</h2>
              </div>
              {authRecords.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No authentication records yet. Authenticate an image above to create a record.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                        <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Original File</th>
                        <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">SHA-256 Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authRecords.map((rec) => (
                        <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="py-2 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{new Date(rec.created_at).toLocaleString()}</td>
                          <td className="py-2 px-3 text-gray-800 dark:text-gray-200">{rec.original_filename || "unknown"}</td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{rec.image_hash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </AnimatedSection>

          {/* PDF Report Export */}
          <AnimatedSection delay={0.35}>
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
