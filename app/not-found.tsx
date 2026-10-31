import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Hero, SiteFooter, SiteHeader } from "@/components/header"

export const metadata: Metadata = {
  title: { absolute: "Page not found · Weekly threat intel" },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <div className="shell">
        <main className="main" id="main" tabIndex={-1}>
          <Hero kicker="404" title="Page not found">
            <Link className="btn btn-solid" href="/">
              go to all reports
              <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
            </Link>
          </Hero>
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
