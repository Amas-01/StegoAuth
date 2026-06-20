"use client"

import { useState, useCallback } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import DropZone from "@/components/upload/DropZone"
import ImagePreview from "@/components/upload/ImagePreview"
import { embedDct, extractDct, generateReport, compareTechniques, runRobustnessTest } from "@/lib/api"
import type { EmbedResponse, CompareResponse, RobustnessResponse } from "@/lib/types"
import { CheckCircle2, XCircle, Download, FileText } from "lucide-react"

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function ReportPage() {
  // Authentication demo
  const [authFile, setAuthFile] = useState<File | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authResult, setAuthResult] = useState<EmbedResponse | null>(null)
  const [authHash, setAuthHash] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // Verification
  const [verifyFile, setVerifyFile] = useState<File | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [verifyMatch, setVerifyMatch] = useState<boolean | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Report export
  const [reportLoading, setReportLoading] = useState(false)
  const [compareData, setCompareData] = useState<CompareResponse | null>(null)
  const [robustnessData, setRobustnessData] = useState<RobustnessResponse | null>(null)

  const handleAuthenticate = useCallback(async () => {
    if (!authFile) return
    setAuthLoading(true)
    setAuthError(null)
    setAuthResult(null)
    setAuthHash(null)
    setCompareData(null)
    setRobustnessData(null)
    try {
      const buffer = await authFile.arrayBuffer()
      const hash = await sha256(buffer)

      const res = await embedDct(authFile, hash)
      setAuthResult(res)
      setAuthHash(hash)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed."
      setAuthError(msg)
    } finally {
      setAuthLoading(false)
    }
  }, [authFile])

  const handleVerify = useCallback(async () => {
    if (!verifyFile || !authHash) return
    setVerifyLoading(true)
    setVerifyError(null)
    setVerifyToken(null)
    setVerifyMatch(null)
    try {
      const res = await extractDct(verifyFile)
      const match = res.extracted_token.trim() === authHash
      setVerifyToken(res.extracted_token)
      setVerifyMatch(match)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed."
      setVerifyError(msg)
    } finally {
      setVerifyLoading(false)
    }
  }, [verifyFile, authHash])

  const handleDownload = () => {
    if (!authResult) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${authResult.stego_image_b64}`
    link.download = `authenticated_image.png`
    link.click()
  }

  const handleGenerateReport = async () => {
    if (!authResult || !authHash) return
    setReportLoading(true)
    try {
      // Fetch compare and robustness data if not already cached
      let cmp = compareData
      let rob = robustnessData

      if (!cmp) {
        cmp = await compareTechniques(authFile!, authHash)
        setCompareData(cmp)
      }
      if (!rob) {
        rob = await runRobustnessTest(authFile!, authHash)
        setRobustnessData(rob)
      }

      const payload = {
        original_b64: cmp.original_b64,
        lsb_stego_b64: cmp.lsb_stego_b64,
        dct_stego_b64: cmp.dct_stego_b64,
        lsb_heatmap_b64: cmp.lsb_heatmap_b64,
        dct_heatmap_b64: cmp.dct_heatmap_b64,
        lsb_metrics: cmp.lsb_metrics,
        dct_metrics: cmp.dct_metrics,
        robustness_results: rob.results,
        verdict: cmp.verdict,
        original_token: authHash,
        extracted_token: verifyToken || "",
        token_match: verifyMatch || false,
      }

      const pdfBlob = await generateReport(payload)

      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      link.download = `stegoauth_report_${ts}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Report generation failed."
      setAuthError(msg)
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Authentication Demo &amp; Report
        </h1>

        {/* Authentication Demo Section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Authentication Demo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Upload Image to Authenticate
              </p>
              {authFile ? (
                <ImagePreview file={authFile} onClear={() => {
                  setAuthFile(null)
                  setAuthResult(null)
                  setAuthHash(null)
                }} />
              ) : (
                <DropZone onFileSelect={setAuthFile} />
              )}
            </div>

            <div className="flex flex-col justify-end">
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                The embedded SHA-256 hash acts as an intrinsic authentication
                code. Any modification to the image after embedding will alter
                the pixel values, preventing correct token recovery and flagging
                the image as tampered.
              </p>
              <button
                onClick={handleAuthenticate}
                disabled={!authFile || authLoading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {authLoading ? "Computing hash & embedding..." : "Authenticate Image (DCT)"}
              </button>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
              {authError}
            </div>
          )}

          {authResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Original Image
                  </p>
                  <img
                    src={URL.createObjectURL(authFile!)}
                    alt="Original"
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">
                      Authenticated Stego Image
                    </p>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <img
                    src={`data:image/png;base64,${authResult.stego_image_b64}`}
                    alt="Stego"
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">
                  Embedded SHA-256 Token
                </p>
                <p className="text-sm font-mono text-slate-800 break-all">
                  {authHash}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Verification Section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Upload Stego Image to Verify
              </p>
              {verifyFile ? (
                <ImagePreview file={verifyFile} onClear={() => {
                  setVerifyFile(null)
                  setVerifyToken(null)
                  setVerifyMatch(null)
                }} />
              ) : (
                <DropZone
                  onFileSelect={setVerifyFile}
                  label="Drop stego image here to verify"
                />
              )}
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={handleVerify}
                disabled={!verifyFile || !authHash || verifyLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifyLoading ? "Verifying..." : "Verify Authenticity"}
              </button>

              {verifyError && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {verifyError}
                </div>
              )}

              {verifyMatch !== null && (
                <div
                  className={`mt-3 p-4 rounded-lg border ${
                    verifyMatch
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {verifyMatch ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">
                          AUTHENTIC &mdash; Token matches expected hash
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">
                          TAMPERED &mdash; Token mismatch or extraction failed
                        </span>
                      </>
                    )}
                  </div>
                  {verifyToken && (
                    <div className="bg-white/80 rounded p-2 mt-2">
                      <p className="text-xs text-slate-500 mb-0.5">
                        Extracted Token
                      </p>
                      <p className="text-xs font-mono text-slate-700 break-all">
                        {verifyToken}
                      </p>
                    </div>
                  )}
                  <div className="bg-white/80 rounded p-2 mt-1">
                    <p className="text-xs text-slate-500 mb-0.5">
                      Expected Hash
                    </p>
                    <p className="text-xs font-mono text-slate-700 break-all">
                      {authHash}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PDF Report Export */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            PDF Report Export
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Generate a full analysis report including images, quality metrics,
            robustness results, and authentication verification. The report
            will be downloaded as a PDF file.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={!authResult || reportLoading}
            className="flex items-center justify-center gap-2 w-full md:w-auto py-2.5 px-6 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
            {reportLoading
              ? "Generating Report..."
              : "Generate Full Analysis Report"}
          </button>
        </section>
      </main>

      <Footer />
    </div>
  )
}
