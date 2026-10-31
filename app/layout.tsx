import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { DEFAULT_ACCENT } from "@/lib/accent.mjs"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Weekly threat intel",
  description: "Weekly reports of the top security themes on X and YouTube, with CVE states, key sources and comment sentiment.",
}

export const viewport: Viewport = {
  themeColor: "#040404",
  colorScheme: "dark light",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-accent={DEFAULT_ACCENT}
      data-accent-kind="gradient"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  )
}
