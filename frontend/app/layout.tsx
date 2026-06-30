import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { LoadingProvider } from "@/context/LoadingContext"
import ProcessingOverlay from "@/components/ui/ProcessingOverlay"
import "./globals.css"

export const metadata: Metadata = {
  title: "StegoAuth Comparator",
  description:
    "A Web-Based Comparative Tool for Spatial-Domain (LSB) and Frequency-Domain (DCT) Steganography in Digital Media Authentication",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <LoadingProvider>
            <ProcessingOverlay />
            {children}
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
