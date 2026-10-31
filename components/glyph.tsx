import type { CSSProperties } from "react"
import { formatCount, sparkGlyphs } from "@/lib/brief.mjs"

/**
 * Glyph tones. Each tone sets a colour and a block glyph, so a split never
 * depends on colour alone.
 * a data █, b data-2 ▓ (the accent, unless it is red), c accent-3 ▒,
 * m muted ▒, n foreground █, d destructive ▓, f mark ░.
 */
export type Tone = "a" | "b" | "c" | "m" | "n" | "d" | "f"

type Vars = CSSProperties & Record<`--${string}`, string | number>

function ratio(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** A glyph bar on a faint track. `value` is 0 to 1. */
export function Bar({
  value,
  tone = "a",
  className,
  bracket,
}: {
  value: number
  tone?: Tone
  className?: string
  bracket?: boolean
}) {
  const style: Vars = { "--v": ratio(value).toFixed(4) }
  const bar = <span aria-hidden="true" className={`bar t-${tone}${className ? ` ${className}` : ""}`} style={style} />
  if (!bracket) return bar
  return (
    <span aria-hidden="true" className="bracket">
      {bar}
    </span>
  )
}

export type Part = { value: number; tone: Tone; label: string }

/** Parts of a whole on one track. Zero parts are left out. */
export function Split({ parts, label, className }: { parts: Part[]; label: string; className?: string }) {
  const shown = parts.filter((part) => part.value > 0)
  return (
    <span aria-label={label} className={`split${className ? ` ${className}` : ""}`} role="img">
      {shown.length === 0 ? <i className="t-f" style={{ flexGrow: 1 }} /> : null}
      {shown.map((part) => (
        <i className={`t-${part.tone}`} key={part.label} style={{ flexGrow: part.value }} />
      ))}
    </span>
  )
}

/** Legend glyph for a tone. */
export function Key({ tone }: { tone: Tone }) {
  return <i aria-hidden="true" className={`key t-${tone}`} />
}

/** A legend row: glyph, label and count. */
export function Legend({ parts, className }: { parts: Part[]; className?: string }) {
  return (
    <ul className={`legend${className ? ` ${className}` : ""}`}>
      {parts.map((part) => (
        <li key={part.label}>
          <Key tone={part.tone} />
          <span>{part.label}</span>
          <span className="num">{formatCount(part.value)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Block spark, one glyph per day. The busiest day is in the data colour. */
export function Spark({ series, label }: { series: number[]; label: string }) {
  if (series.length === 0) return null
  const glyphs = sparkGlyphs(series)
  const peak = Math.max(...series)
  const at = peak > 0 ? series.indexOf(peak) : -1
  return (
    <span aria-label={label} className="spark" role="img">
      <span aria-hidden="true">
        {at < 0 ? (
          glyphs.join("")
        ) : (
          <>
            {glyphs.slice(0, at).join("")}
            <span className="spark-peak">{glyphs[at]}</span>
            {glyphs.slice(at + 1).join("")}
          </>
        )}
      </span>
    </span>
  )
}

/**
 * Discrete cells: `hot` cells in the destructive tone (▓), the rest faint (░).
 * Large totals are scaled to `max` cells. Scaling never shows no hot cell when one
 * CVE is exploited, or only hot cells when one is not.
 */
export function Meter({ hot, total, max = 24, label }: { hot: number; total: number; max?: number; label: string }) {
  const all = Math.max(total, 0)
  const cells = Math.min(all, max)
  const lit = Math.min(Math.max(hot, 0), all)
  let on = all > 0 ? Math.round((lit / all) * cells) : 0
  if (lit > 0) on = Math.max(1, on)
  if (lit < all) on = Math.min(on, Math.max(cells - 1, 0))
  return (
    <span aria-label={label} className="meter" role="img">
      <span aria-hidden="true" className="meter-on">
        {"▓".repeat(on)}
      </span>
      <span aria-hidden="true" className="meter-off">
        {"░".repeat(Math.max(cells - on, 0))}
      </span>
    </span>
  )
}

/** Change against the previous week. Rank moves up when the number is positive. */
export function Delta({
  value,
  isNew,
  unit,
  invert,
}: {
  value: number
  isNew?: boolean
  unit?: string
  invert?: boolean
}) {
  if (isNew) return <span className="delta delta-new">new</span>
  if (value === 0) return <span className="delta">=</span>
  const up = value > 0
  const text = `${up ? "↑" : "↓"}${formatCount(Math.abs(value))}`
  const tone = up ? (invert ? "delta-bad" : "delta-up") : "delta-down"
  return (
    <span className={`delta ${tone}`}>
      {text}
      {unit ? <span className="sr-only"> {unit}</span> : null}
    </span>
  )
}
