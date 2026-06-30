"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import PageTransition from "@/components/ui/PageTransition"
import AnimatedSection from "@/components/ui/AnimatedSection"
import { ChevronDown } from "lucide-react"

const GLOSSARY = [
  {
    term: "LSB (Least Significant Bit)",
    definition:
      "A spatial-domain steganographic technique that hides data by replacing the last (least significant) bit of each pixel channel value with a message bit. Because the change is only 1 unit on a 0–255 scale, it is invisible to the human eye. LSB offers very high embedding capacity but is destroyed by JPEG compression.",
  },
  {
    term: "DCT (Discrete Cosine Transform)",
    definition:
      "A frequency-domain technique that transforms image blocks into frequency coefficients before embedding. Data is hidden by adjusting the parity (even/odd value) of a mid-frequency coefficient in each 8×8 pixel block. DCT aligns with the JPEG compression standard, making embedded data significantly more resistant to compression.",
  },
  {
    term: "PSNR (Peak Signal-to-Noise Ratio)",
    definition:
      "Measures image quality after embedding. Expressed in decibels (dB). Higher is better. The accepted threshold for imperceptible embedding is 40 dB. LSB typically achieves 50–55 dB. DCT typically achieves 40–50 dB. A value below 30 dB indicates visible distortion.",
  },
  {
    term: "MSE (Mean Squared Error)",
    definition:
      "Measures the average squared pixel difference between the original and stego image. Lower MSE means less distortion. MSE is computed across all three RGB channels. A value of 0 means the images are pixel-identical.",
  },
  {
    term: "SSIM (Structural Similarity Index)",
    definition:
      "A perceptual quality metric that compares luminance, contrast, and structural patterns between two images. Values range from –1 to 1. A value of 1.0 means perfect structural identity. Values above 0.98 indicate imperceptible embedding. Values below 0.90 suggest visible distortion.",
  },
  {
    term: "BER (Bit Error Rate)",
    definition:
      "Used in robustness testing. Measures the proportion of payload bits incorrectly recovered after JPEG compression. BER = 0.0 means the token was recovered perfectly. BER = 1.0 means complete corruption. LSB typically produces BER = 1.0 at all JPEG quality levels. DCT can maintain BER = 0.0 at higher quality levels.",
  },
  {
    term: "Authentication Token",
    definition:
      "A fixed-length string embedded inside the image as a hidden verification code. In this tool, it is a 64-character ASCII string. In production systems, this would be a cryptographic hash of the image content, allowing later verification that the image has not been tampered with.",
  },
  {
    term: "Stego Image",
    definition:
      "An image that contains hidden data embedded by a steganographic algorithm. Visually identical to the original cover image under normal viewing conditions.",
  },
  {
    term: "JPEG Compression",
    definition:
      "A lossy image compression process that applies the DCT, quantises frequency coefficients, and discards fine detail. It is the most common form of image processing on the web and in mobile messaging. It destroys LSB-embedded data entirely but DCT-embedded data can survive at higher quality settings.",
  },
  {
    term: "Robustness",
    definition:
      "The ability of embedded authentication data to survive image processing operations such as JPEG compression, resizing, or noise addition. DCT demonstrates higher robustness than LSB in this tool's experimental tests.",
  },
  {
    term: "Imperceptibility",
    definition:
      "The property of a stego image being visually indistinguishable from the original cover image under ordinary viewing conditions. Measured objectively using PSNR and SSIM.",
  },
  {
    term: "Ephemeral Processing",
    definition:
      "A security design principle used in this application: uploaded images are never saved to a permanent server directory or database. All processing occurs in memory or in auto-deleted temporary files.",
  },
]

function AccordionItem({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/80 dark:bg-gray-900/80 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
        aria-expanded={open}
      >
        <span className="font-heading font-semibold text-gray-800 dark:text-gray-100 text-sm">
          {term}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
          {definition}
        </div>
      )}
    </div>
  )
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <PageTransition>
          <AnimatedSection delay={0}>
            <div className="mb-10">
              <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-white mb-3 tracking-tight">
                Documentation &amp; Glossary
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                How-to guide, terminology reference, and project information for StegoAuth Comparator.
              </p>
            </div>
          </AnimatedSection>

          {/* Section 1 — How to Use */}
          <AnimatedSection delay={0.1}>
            <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-8">
              <h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Getting Started
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                StegoAuth Comparator embeds hidden authentication tokens inside digital images using two steganographic techniques. You can then test whether that token survives compression and compare the visual quality impact of each method.
              </p>

              <div className="space-y-5">
                {[
                  {
                    step: "Step 1 — Embed a Token",
                    content: "Go to the Embed page. Upload a PNG or JPEG image (max 5 MB). Type or paste an authentication token (up to 64 characters). Select LSB or DCT. Click \"Embed Authentication Token\". Download your stego image.",
                    color: "blue",
                  },
                  {
                    step: "Step 2 — Compare Both Techniques",
                    content: "Go to the Compare page. Upload your image and enter your token. Click \"Run Comparative Analysis\". The tool automatically runs both LSB and DCT and displays a side-by-side comparison with metrics.",
                    color: "emerald",
                  },
                  {
                    step: "Step 3 — Test Robustness",
                    content: "Go to the Robustness Lab. Upload your image and token. Click \"Run Robustness Test\". The tool compresses your stego image at 5 JPEG quality levels and checks whether the embedded token survives each one.",
                    color: "orange",
                  },
                  {
                    step: "Step 4 — Export a Report",
                    content: "Go to Auth Demo & Report. After running a comparison or robustness test, click \"Generate PDF Report\" to download a full analysis document containing your images, metrics, and conclusions.",
                    color: "purple",
                  },
                ].map(({ step, content, color }) => {
                  const borderColor = {
                    blue: "border-blue-200 dark:border-blue-900/50",
                    emerald: "border-emerald-200 dark:border-emerald-900/50",
                    orange: "border-orange-200 dark:border-orange-900/50",
                    purple: "border-purple-200 dark:border-purple-900/50",
                  }[color]
                  const stepColor = {
                    blue: "text-blue-600 dark:text-blue-400",
                    emerald: "text-emerald-600 dark:text-emerald-400",
                    orange: "text-orange-600 dark:text-orange-400",
                    purple: "text-purple-600 dark:text-purple-400",
                  }[color]
                  return (
                    <div key={step} className={`rounded-xl border-l-4 ${borderColor} pl-4 py-2`}>
                      <p className={`text-sm font-semibold font-heading mb-1 ${stepColor}`}>{step}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{content}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          </AnimatedSection>

          {/* Section 2 — Glossary */}
          <AnimatedSection delay={0.2}>
            <section className="mb-8">
              <h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">
                Glossary
              </h2>
              <div className="space-y-2">
                {GLOSSARY.map((item) => (
                  <AccordionItem key={item.term} term={item.term} definition={item.definition} />
                ))}
              </div>
            </section>
          </AnimatedSection>

          {/* Section 3 — About */}
          <AnimatedSection delay={0.3}>
            <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                About This Project
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                StegoAuth Comparator is the practical implementation deliverable of a BSc Cyber Security Science thesis titled{" "}
                <em>&ldquo;Development of a Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication&rdquo;</em>,{" "}
                completed at the Department of Cyber Security Science, Federal University of Technology, Minna, Niger State, Nigeria.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                The application implements steganographic algorithms exactly as documented in the thesis methodology (Chapter 3). Metrics are computed using OpenCV, NumPy, and scikit-image. The backend is built with FastAPI (Python 3.11) and the frontend with Next.js 14. No images are stored server-side. All processing is ephemeral.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["FastAPI", "Python 3.11", "Next.js 14", "OpenCV", "NumPy", "scikit-image"].map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-900 font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </AnimatedSection>
        </PageTransition>
      </main>

      <Footer />
    </div>
  )
}
