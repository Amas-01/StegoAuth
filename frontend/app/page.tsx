"use client"

import Link from "next/link"
import {
  ArrowRight,
  FileCode,
  BarChart3,
  Shield,
  FileText,
  Lock,
  CheckCircle,
  Zap,
  Globe,
} from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import ParticleBackground from "@/components/ui/ParticleBackground"

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950">
      <Navbar />

      <div className="relative flex-1">
        <ParticleBackground />

        <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <PageTransition>
            {/* Hero Header */}
            <AnimatedSection delay={0}>
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-mono mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  BSc Cyber Security Science — FUT Minna
                </div>
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                  StegoAuth{" "}
                  <span className="text-blue-500">Comparator</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  A Web-Based Comparative Tool for Spatial-Domain (LSB) and
                  Frequency-Domain (DCT) Steganography in Digital Media Authentication
                </p>
              </div>
            </AnimatedSection>

            {/* Navigation Cards */}
            <AnimatedSection delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
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
                  title="Auth Demo &amp; Report"
                  description="Verify image authenticity and export a PDF analysis report"
                  color="purple"
                />
              </div>
            </AnimatedSection>

            {/* Technique Comparison Cards */}
            <AnimatedSection delay={0.2}>
              <h2 className="font-heading text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Technique Comparison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
                {/* LSB Card */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <h3 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Least Significant Bit (LSB)
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Domain:</span> Spatial Domain
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["High Capacity", "Fast Processing", "Single-bit modification", "Vulnerable to JPEG compression"].map((prop) => (
                      <span key={prop} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-900">
                        {prop}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Expected PSNR:</span> <span className="font-mono text-blue-500">&gt; 50 dB</span></p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Expected SSIM:</span> <span className="font-mono text-blue-500">&gt; 0.999</span></p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Capacity (512×512):</span> <span className="font-mono text-blue-500">786,432 bits</span></p>
                  </div>
                </div>

                {/* DCT Card */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-orange-400/50 dark:hover:border-orange-500/50 transition-all duration-300 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <h3 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Discrete Cosine Transform (DCT)
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Domain:</span> Frequency Domain
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Moderate Capacity", "Slower Processing", "8×8 block-based", "Compression-resistant"].map((prop) => (
                      <span key={prop} className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-xs rounded-full border border-orange-100 dark:border-orange-900">
                        {prop}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Expected PSNR:</span> <span className="font-mono text-orange-500">40–50 dB</span></p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Expected SSIM:</span> <span className="font-mono text-orange-500">&gt; 0.98</span></p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Capacity (512×512):</span> <span className="font-mono text-orange-500">4,096 bits</span></p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* About Section */}
            <AnimatedSection delay={0.3}>
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-10">
                <h2 className="font-heading text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">About</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  Digital image manipulation is a growing cybersecurity threat in Nigeria.
                  Manipulated images are used in misinformation campaigns, identity fraud,
                  and political deception across WhatsApp and Facebook. This tool implements
                  and compares two steganographic authentication techniques — LSB and DCT —
                  to determine which better protects digital media integrity under the
                  compression conditions typical of Nigerian mobile networks.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  The study is conducted in the Department of Cyber Security Science,
                  Federal University of Technology, Minna, Niger State, Nigeria.
                </p>
              </div>
            </AnimatedSection>

            {/* Security Badges */}
            <AnimatedSection delay={0.4}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <SecurityBadge
                  icon={<Lock className="w-4 h-4" />}
                  title="Ephemeral Processing"
                  description="No images stored server-side"
                  color="blue"
                />
                <SecurityBadge
                  icon={<CheckCircle className="w-4 h-4" />}
                  title="Input Validated"
                  description="Magic byte file type verification"
                  color="emerald"
                />
                <SecurityBadge
                  icon={<Zap className="w-4 h-4" />}
                  title="Rate Limited"
                  description="5–20 requests per minute per IP"
                  color="orange"
                />
                <SecurityBadge
                  icon={<Globe className="w-4 h-4" />}
                  title="CORS Restricted"
                  description="Localhost only in development"
                  color="purple"
                />
              </div>
            </AnimatedSection>
          </PageTransition>
        </main>
      </div>

      <Footer />
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
    blue: "border-blue-200 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-100 dark:hover:shadow-blue-900/20",
    emerald: "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20",
    orange: "border-orange-200 dark:border-orange-900/50 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-orange-100 dark:hover:shadow-orange-900/20",
    purple: "border-purple-200 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-purple-100 dark:hover:shadow-purple-900/20",
  }
  const iconMap: Record<string, string> = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    purple: "text-purple-500",
  }

  return (
    <Link
      href={href}
      className={`group bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border ${colorMap[color]} shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 p-5`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`${iconMap[color]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </span>
        <h3 className="font-heading font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <ArrowRight className="w-4 h-4 ml-auto text-gray-400 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </Link>
  )
}

function SecurityBadge({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: "blue" | "emerald" | "orange" | "purple"
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400",
    orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400",
  }

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]} transition-colors duration-200`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-xs opacity-70 mt-0.5">{description}</p>
    </div>
  )
}
