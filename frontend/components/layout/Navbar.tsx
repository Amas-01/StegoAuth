"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Embed", href: "/embed" },
  { label: "Compare", href: "/compare" },
  { label: "Robustness Lab", href: "/robustness" },
  { label: "Auth Demo", href: "/report" },
  { label: "Documentation", href: "/documentation" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render theme toggle after mount
  useEffect(() => setMounted(true), [])

  const isDark = theme === "dark"

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 flex-shrink-0">
            <svg viewBox="0 0 32 32" className="w-full h-full" aria-hidden="true">
              <path
                d="M16 2 L28 7 L28 18 C28 24 22 29 16 31 C10 29 4 24 4 18 L4 7 Z"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
              <rect x="10" y="11" width="3" height="3" fill="#3b82f6" opacity="1.0" rx="0.5" />
              <rect x="14.5" y="11" width="3" height="3" fill="#3b82f6" opacity="0.4" rx="0.5" />
              <rect x="19" y="11" width="3" height="3" fill="#3b82f6" opacity="0.7" rx="0.5" />
              <rect x="10" y="15.5" width="3" height="3" fill="#3b82f6" opacity="0.5" rx="0.5" />
              <rect x="14.5" y="15.5" width="3" height="3" fill="#60a5fa" opacity="1.0" rx="0.5" />
              <rect x="19" y="15.5" width="3" height="3" fill="#3b82f6" opacity="0.3" rx="0.5" />
              <rect x="10" y="20" width="3" height="3" fill="#3b82f6" opacity="0.6" rx="0.5" />
              <rect x="14.5" y="20" width="3" height="3" fill="#3b82f6" opacity="0.2" rx="0.5" />
              <rect x="19" y="20" width="3" height="3" fill="#3b82f6" opacity="0.8" rx="0.5" />
            </svg>
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            <span className="text-gray-900 dark:text-white">Stego</span>
            <span className="text-blue-500">Auth</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white dark:bg-blue-500 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
              id="theme-toggle-btn"
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         text-gray-600 dark:text-gray-400
                         transition-all duration-200"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
