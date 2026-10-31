import type { ReactNode } from "react"
import { Corners } from "@/components/frame"

const CVE_ID = /(CVE-\d{4}-\d{4,})/i

/** Plain text with each CVE id kept on one line, so an id never breaks at its hyphens. */
export function KeepCves({ text }: { text: string }) {
  const parts = String(text ?? "").split(CVE_ID)
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span className="nowrap" key={index}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export type CalloutType = "note" | "tip" | "warning" | "danger"

const GLYPH: Record<CalloutType, string> = { note: "i", tip: "+", warning: "!", danger: "×" }

/** mdxcn callout: a dashed frame, a `[ TYPE ]` title and a glyph column. */
export function Callout({
  type = "note",
  title,
  children,
  className,
}: {
  type?: CalloutType
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`frame callout callout-${type}${className ? ` ${className}` : ""}`} role="note">
      <p aria-hidden="true" className="frame-title">
        <span className="graph-title-ink">[ {title ?? type} ]</span>
      </p>
      <Corners />
      <span aria-hidden="true" className="callout-glyph">
        {GLYPH[type]}
      </span>
      <div className="callout-body">
        <span className="sr-only">{title ?? type}: </span>
        {children}
      </div>
    </div>
  )
}

/** A comment sample. Commenter names are not shown. */
export function Quote({ text, href, date, label }: { text: string; href: string | null; date: string; label: string }) {
  return (
    <blockquote className="quote">
      <span aria-hidden="true" className="quote-mark">
        “
      </span>
      <p dir="auto">{text}</p>
      <footer>
        <span aria-hidden="true">—</span>
        {date ? <span className="date-unit">{date}</span> : null}
        {href ? (
          <a href={href} rel="noreferrer">
            {label}
          </a>
        ) : null}
      </footer>
    </blockquote>
  )
}

/** Numbered steps on a rail. */
export function Steps({ steps }: { steps: { title: string; detail: string | null }[] }) {
  const digits = Math.max(2, String(steps.length).length)
  return (
    <ol className="steps">
      {steps.map((step, index) => (
        <li key={`${index}-${step.title}`}>
          <span aria-hidden="true" className="step-n">
            {String(index + 1).padStart(digits, "0")}
          </span>
          <div>
            <p className="step-title">{step.title}</p>
            {step.detail ? <p className="step-detail">{step.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
