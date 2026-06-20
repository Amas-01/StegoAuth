import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "StegoAuth Comparator",
  description:
    "A Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
