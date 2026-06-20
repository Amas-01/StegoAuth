"use client"

import Link from "next/link"
import {
  ArrowRight,
  FileCode,
  BarChart3,
  Shield,
  FileText,
} from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-lg text-slate-800">
              StegoAuth Comparator
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="font-medium text-blue-600">Dashboard</Link>
            <Link href="/embed" className="hover:text-blue-600 transition-colors">Embed</Link>
            <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare</Link>
            <Link href="/robustness" className="hover:text-blue-600 transition-colors">Robustness</Link>
            <Link href="/report" className="hover:text-blue-600 transition-colors">Report</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            StegoAuth Comparator
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A Web-Based Comparative Tool for Spatial-Domain (LSB) and
            Frequency-Domain (DCT) Steganography in Digital Media Authentication
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <NavCard
            href="/embed"
            icon={<FileCode className="w-6 h-6" />}
            title="Embed"
            description="Embed an authentication token into a single image using LSB or DCT"
            color="blue"
          />
          <NavCard
            href="/compare"
            icon={<BarChart3 className="w-6 h-6" />}
            title="Compare"
            description="Run both LSB and DCT on one image and compare results side by side"
            color="emerald"
          />
          <NavCard
            href="/robustness"
            icon={<Shield className="w-6 h-6" />}
            title="Robustness Lab"
            description="Test token survival under JPEG compression at 5 quality levels"
            color="orange"
          />
          <NavCard
            href="/report"
            icon={<FileText className="w-6 h-6" />}
            title="Auth Demo & Report"
            description="Verify image authenticity and export a PDF analysis report"
            color="purple"
          />
        </div>

        {/* Technique Comparison Cards */}
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Technique Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* LSB Card */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="text-xl font-semibold text-slate-800">
                Least Significant Bit (LSB)
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-medium">Domain:</span> Spatial Domain
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["High Capacity", "Fast Processing", "Single-bit modification", "Vulnerable to JPEG compression"].map((prop) => (
                <span
                  key={prop}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {prop}
                </span>
              ))}
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium">Expected PSNR:</span> &gt; 50 dB</p>
              <p><span className="font-medium">Expected SSIM:</span> &gt; 0.999</p>
              <p><span className="font-medium">Capacity (512×512):</span> 786,432 bits (98,304 bytes)</p>
            </div>
          </div>

          {/* DCT Card */}
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <h3 className="text-xl font-semibold text-slate-800">
                Discrete Cosine Transform (DCT)
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-medium">Domain:</span> Frequency Domain
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Moderate Capacity", "Slower Processing", "8×8 block-based", "Compression-resistant"].map((prop) => (
                <span
                  key={prop}
                  className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
                >
                  {prop}
                </span>
              ))}
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium">Expected PSNR:</span> 40–50 dB</p>
              <p><span className="font-medium">Expected SSIM:</span> &gt; 0.98</p>
              <p><span className="font-medium">Capacity (512×512):</span> 4,096 bits (512 bytes)</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">About</h2>
          <p className="text-slate-600 leading-relaxed">
            Digital image manipulation is a growing cybersecurity threat in Nigeria.
            Manipulated images are used in misinformation campaigns, identity fraud,
            and political deception across WhatsApp and Facebook. This tool implements
            and compares two steganographic authentication techniques — LSB and DCT —
            to determine which better protects digital media integrity under the
            compression conditions typical of Nigerian mobile networks.
          </p>
          <p className="text-slate-500 text-sm mt-4">
            The study is conducted in the Department of Cyber Security Science,
            Federal University of Technology, Minna, Niger State, Nigeria.
          </p>
        </div>

        {/* Security Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SecurityBadge
            title="Ephemeral Processing"
            description="No images stored server-side"
            color="blue"
          />
          <SecurityBadge
            title="Input Validated"
            description="Magic byte file type verification"
            color="emerald"
          />
          <SecurityBadge
            title="Rate Limited"
            description="5–20 requests per minute per IP"
            color="orange"
          />
          <SecurityBadge
            title="CORS Restricted"
            description="Localhost only in development"
            color="purple"
          />
        </div>
      </main>

      <footer className="border-t bg-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p className="mb-1">
            Department of Cyber Security Science, Federal University of Technology,
            Minna, Niger State, Nigeria
          </p>
          <p>
            &copy; {new Date().getFullYear()} StegoAuth Comparator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function NavCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: "blue" | "emerald" | "orange" | "purple"
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100",
    emerald: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    orange: "border-orange-200 hover:border-orange-400 hover:shadow-orange-100",
    purple: "border-purple-200 hover:border-purple-400 hover:shadow-purple-100",
  }

  return (
    <Link
      href={href}
      className={`group bg-white rounded-xl border ${colorMap[color]} shadow-sm p-5 hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-600 group-hover:text-blue-600 transition-colors">
          {icon}
        </span>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>
      <p className="text-sm text-slate-500">{description}</p>
    </Link>
  )
}

function SecurityBadge({
  title,
  description,
  color,
}: {
  title: string
  description: string
  color: "blue" | "emerald" | "orange" | "purple"
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  }

  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs opacity-80 mt-0.5">{description}</p>
    </div>
  )
}
