"use client"

import Link from "next/link"
import { Shield } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-lg text-slate-800">
            StegoAuth Comparator
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <Link
            href="/embed"
            className="font-medium text-blue-600"
          >
            Embed
          </Link>
          <Link
            href="/compare"
            className="hover:text-blue-600 transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/robustness"
            className="hover:text-blue-600 transition-colors"
          >
            Robustness
          </Link>
          <Link
            href="/report"
            className="hover:text-blue-600 transition-colors"
          >
            Report
          </Link>
        </div>
      </div>
    </nav>
  )
}
