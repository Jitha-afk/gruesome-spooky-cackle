import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { DEFAULT_ACCENT } from "@/lib/accent.mjs"
import { FEED_TYPES, OPEN_GRAPH, OWNER_NAME, OWNER_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site"
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
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: OWNER_NAME, url: OWNER_URL }],
  creator: OWNER_NAME,
  alternates: { types: FEED_TYPES },
  openGraph: OPEN_GRAPH,
  twitter: { card: "summary_large_image" },
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
