import Link from "next/link"
import type { ReactNode } from "react"
import { Moon, Sun, TableOfContents } from "lucide-react"
import { AccentPicker } from "@/components/accent-picker"

export function DateUnits({ text }: { text: string }) {
  const marker = " to "
  const at = text.indexOf(marker)
  if (at === -1) return text
  return (
    <>
      <span className="date-unit">{text.slice(0, at)}</span>
      {marker}
      <span className="date-unit">{text.slice(at + marker.length)}</span>
    </>
  )
}

/** Site mark: a dashed frame with `+` corners and three rising bars in the accent family. */
export function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" height="16" viewBox="0 0 32 32" width="16">
      <rect className="mk-frame" fill="none" height="23" strokeDasharray="2 2" width="23" x="4.5" y="4.5" />
      <path
        className="mk-ink"
        d="M4.5 2v5M2 4.5h5M27.5 2v5M25 4.5h5M4.5 25v5M2 27.5h5M27.5 25v5M25 27.5h5"
        fill="none"
      />
      <rect className="mk-c" height="6" width="4" x="8" y="18" />
      <rect className="mk-b" height="11" width="4" x="14" y="13" />
      <rect className="mk-a" height="16" width="4" x="20" y="8" />
    </svg>
  )
}

export type TocItem = { id: string; label: string; count?: ReactNode; sub?: TocItem[] }

export function Toc({ items, label = "On this page" }: { items: TocItem[]; label?: string }) {
  return (
    <nav aria-label={label} className="toc">
      <p className="kicker">on this page</p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>
              <span className="toc-label">{item.label}</span>
              {item.count != null ? <span className="num">{item.count}</span> : null}
            </a>
            {item.sub && item.sub.length > 0 ? (
              <ol className="toc-sub">
                {item.sub.map((sub) => (
                  <li key={sub.id}>
                    <a href={`#${sub.id}`}>
                      <span className="toc-label">{sub.label}</span>
                      {sub.count != null ? <span className="num">{sub.count}</span> : null}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Sticky header on the site rails. The accent and contents menus are native
 * popovers, so the contents menu works without JS.
 */
export function SiteHeader({ crumb, toc }: { crumb?: ReactNode; toc?: TocItem[] }) {
  return (
    <>
      <a className="skip" href="#main">
        Go to the main content
      </a>
      <header className={["site-header", toc ? "has-side" : "", crumb ? "has-crumb" : ""].filter(Boolean).join(" ")}>
        <div className="wrap header-bar">
          <Link aria-label="Weekly threat intel, all weeks" className="brand" href="/">
            <BrandMark />
            <span className="brand-name">threat intel</span>
          </Link>
          {crumb ? (
            <span className="crumb">
              <span aria-hidden="true" className="crumb-sep">
                /
              </span>
              {crumb}
            </span>
          ) : null}
          <div className="header-actions">
            <button
              aria-label="Select an accent colour"
              className="icon-btn accent-btn js-only"
              popoverTarget="accent-menu"
              type="button"
            >
              <i aria-hidden="true" className="accent-dot" />
            </button>
            <button aria-label="Light or dark mode" className="icon-btn js-only" data-theme-toggle type="button">
              <Sun aria-hidden="true" className="only-dark" size={16} strokeWidth={1.75} />
              <Moon aria-hidden="true" className="only-light" size={16} strokeWidth={1.75} />
            </button>
            {toc ? (
              <button aria-label="On this page" className="icon-btn toc-btn" popoverTarget="toc-menu" type="button">
                <TableOfContents aria-hidden="true" size={16} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
          <i aria-hidden="true" className="mark mark-bl" />
          <i aria-hidden="true" className="mark mark-br" />
          {toc ? <i aria-hidden="true" className="mark mark-side" /> : null}
        </div>
      </header>
      <div className="pop pop-accent" id="accent-menu" popover="auto">
        <AccentPicker name="accent-menu" />
      </div>
      {toc ? (
        <div className="pop pop-toc" id="toc-menu" popover="auto">
          <Toc items={toc} label="On this page, menu" />
        </div>
      ) : null}
    </>
  )
}

const OWNER_URL = "https://www.linkedin.com/in/jithamsft/"

/** The byline under every lead: who the reports are for and what makes them. */
function Intro() {
  return (
    <p className="intro rise">
      This site shows automatic weekly threat intel reports for{" "}
      <a className="intro-name" href={OWNER_URL} rel="noreferrer">
        Jitesh Thakur
      </a>
      . AI agents from Grok, Cursor and Copilot find the sources, write each report and build the site.
    </p>
  )
}

export function Hero({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: ReactNode
  title: string
  lead?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="hero">
      <p className="kicker rise">{kicker}</p>
      <h1>{title}</h1>
      {lead ? <p className="lead rise">{lead}</p> : null}
      <Intro />
      {children ? <div className="hero-meta rise">{children}</div> : null}
    </header>
  )
}

export function SiteFooter({ side = false, children }: { side?: boolean; children?: ReactNode }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-bar">
        <p className="footer-brand">
          <BrandMark />
          <span>Weekly threat intel</span>
        </p>
        {children ? <div className="footer-note">{children}</div> : null}
        <i aria-hidden="true" className="mark mark-tl" />
        <i aria-hidden="true" className="mark mark-tr" />
        {side ? <i aria-hidden="true" className="mark mark-side" /> : null}
      </div>
    </footer>
  )
}
