// The share cards of a week, drawn by next/og at build time from data.json:
// og.png (1200×630) for link previews and share.png (1080×1350) for image posts.
import fs from "node:fs"
import path from "node:path"
import type { CSSProperties, ReactNode } from "react"
import { cveSentence, formatCount, shortLabel, themesByRank, windowLabel, type WeekData } from "./brief.mjs"
import { CARD_SIZE, OWNER_NAME, SHARE_SIZE, SITE_NAME, SITE_URL } from "./site"

// Satori cannot read woff2, so the cards use the TTFs of the geist package.
const FONT_DIR = path.join(process.cwd(), "node_modules", "geist", "dist", "fonts")

// Satori measures text without kerning, but it draws text with kerning. A kerned word is then
// narrower than its box, and the gap after it is too wide ("attackers  exploit").
// This renames the "kern" feature in the GPOS table, so the drawn text has the measured width.
function withoutKerning(font: Buffer): Buffer {
  const tables = font.readUInt16BE(4)
  for (let i = 0; i < tables; i++) {
    const record = 12 + i * 16
    if (font.toString("latin1", record, record + 4) !== "GPOS") continue
    const gpos = font.readUInt32BE(record + 8)
    const features = gpos + font.readUInt16BE(gpos + 6)
    for (let j = 0; j < font.readUInt16BE(features); j++) {
      const tag = features + 2 + j * 6
      if (font.toString("latin1", tag, tag + 4) === "kern") font.write("xern", tag, "latin1")
    }
  }
  return font
}

export function cardFonts() {
  const font = (file: string, name: string, weight: 400 | 500 | 600) => ({
    name,
    weight,
    style: "normal" as const,
    data: withoutKerning(fs.readFileSync(path.join(FONT_DIR, file))),
  })
  return [
    font("geist-sans/Geist-Regular.ttf", "Geist", 400),
    font("geist-sans/Geist-SemiBold.ttf", "Geist", 600),
    font("geist-mono/GeistMono-Medium.ttf", "Geist Mono", 500),
  ]
}

// The dark theme and the prism accent of the site, in sRGB.
const C = {
  bg: "#040404",
  fg: "#d1d1d1",
  muted: "#8a8a8a",
  frame: "#6a6a6a",
  rail: "#2e2e2e",
  track: "#161616",
  a: "#00c1eb",
  b: "#c472ed",
  c: "#f4505a",
}
const PRISM = `linear-gradient(90deg, ${C.a}, ${C.b}, ${C.c})`
const BAR_COLOURS = [C.a, C.b, C.c, C.muted, C.muted]
const MONO = "Geist Mono"

// Bars are cells of 9px with 3px gaps, as the bracket bars on the site.
const CELL = 12
const cells = (colour: string) =>
  `repeating-linear-gradient(90deg, ${colour} 0px, ${colour} ${CELL - 3}px, transparent ${CELL - 3}px, transparent ${CELL}px)`
const dashX = (colour: string) => `repeating-linear-gradient(90deg, ${colour} 0px, ${colour} 2px, transparent 2px, transparent 7px)`
const dashY = (colour: string) => `repeating-linear-gradient(180deg, ${colour} 0px, ${colour} 2px, transparent 2px, transparent 7px)`

function Line({ style, vertical, colour }: { style: CSSProperties; vertical?: boolean; colour: string }) {
  return <div style={{ position: "absolute", display: "flex", backgroundImage: vertical ? dashY(colour) : dashX(colour), ...style }} />
}

function Plus({ x, y }: { x: number; y: number }) {
  return (
    <div style={{ position: "absolute", left: x - 6, top: y - 6, width: 13, height: 13, display: "flex" }}>
      <div style={{ position: "absolute", left: 0, top: 6, width: 13, height: 1, background: C.muted }} />
      <div style={{ position: "absolute", left: 6, top: 0, width: 1, height: 13, background: C.muted }} />
    </div>
  )
}

function Ink({ children, style }: { children: string; style?: CSSProperties }) {
  return <span style={{ backgroundImage: PRISM, backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
}

/** The page rails, the dashed frame with + corners and the frame title, as on the site. */
function Frame({ size, inset, title, children }: { size: { width: number; height: number }; inset: { x: number; y: number }; title: number; children: ReactNode }) {
  const { width, height } = size
  const right = width - inset.x
  const bottom = height - inset.y
  return (
    <div style={{ width, height, display: "flex", position: "relative", background: C.bg, color: C.fg, fontFamily: "Geist" }}>
      <Line vertical colour={C.rail} style={{ left: 28, top: 0, width: 1, height }} />
      <Line vertical colour={C.rail} style={{ left: width - 29, top: 0, width: 1, height }} />
      <Line colour={C.frame} style={{ left: inset.x, top: inset.y, width: right - inset.x, height: 1 }} />
      <Line colour={C.frame} style={{ left: inset.x, top: bottom, width: right - inset.x, height: 1 }} />
      <Line vertical colour={C.frame} style={{ left: inset.x, top: inset.y, width: 1, height: bottom - inset.y }} />
      <Line vertical colour={C.frame} style={{ left: right, top: inset.y, width: 1, height: bottom - inset.y }} />
      <Plus x={inset.x} y={inset.y} />
      <Plus x={right} y={inset.y} />
      <Plus x={inset.x} y={bottom} />
      <Plus x={right} y={bottom} />
      <div style={{ position: "absolute", left: 0, top: inset.y - Math.round(title * 0.7), width, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", padding: "0 14px", background: C.bg, fontFamily: MONO, fontWeight: 500, fontSize: title, lineHeight: 1.4, letterSpacing: title * 0.08 }}>
          <Ink style={{ textTransform: "uppercase" }}>{`[ ${SITE_NAME} report ]`}</Ink>
        </div>
      </div>
      {children}
    </div>
  )
}

type RowSizes = { name: number; count: number; bar: number; cells: number; gap: number }

/** "PHP2Shell · 30 accounts" with a bracket bar. Inline puts the bar to the right, stacked puts it below. */
function Rows({ data, count, sizes, stacked }: { data: WeekData; count: number; sizes: RowSizes; stacked?: boolean }) {
  const themes = themesByRank(data).slice(0, count)
  const max = Math.max(...themes.map((theme) => theme.distinct_accounts), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: sizes.gap }}>
      {themes.map((theme, index) => {
        const accounts = theme.distinct_accounts
        const filled = Math.max(1, Math.round((accounts / max) * sizes.cells))
        return (
          <div key={theme.key} style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? "stretch" : "center", gap: stacked ? 14 : 16 }}>
            <div style={{ display: "flex", alignItems: "flex-end", flexGrow: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", lineHeight: 1 }}>
              <span style={{ fontWeight: 600, fontSize: sizes.name, letterSpacing: -0.6, color: C.fg }}>{shortLabel(theme.name, theme.short_name)}</span>
              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: sizes.count, color: C.muted, marginLeft: 12, marginBottom: 2 }}>
                {`· ${formatCount(accounts)} ${accounts === 1 ? "account" : "accounts"}`}
              </span>
            </div>
            <div style={{ display: "flex", flexShrink: 0, alignItems: "center", fontFamily: MONO, fontWeight: 500, fontSize: 23, color: C.muted }}>
              <span>[</span>
              <div style={{ display: "flex", width: sizes.cells * CELL - 3, height: sizes.bar, margin: "0 10px", backgroundImage: cells(C.track) }}>
                <div style={{ display: "flex", width: filled * CELL - 3, height: sizes.bar, backgroundImage: cells(BAR_COLOURS[index] ?? C.muted) }} />
              </div>
              <span>]</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const kicker = (size: number): CSSProperties => ({ display: "flex", fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: 1.3, letterSpacing: size * 0.025, color: C.a })
const heading = (size: number): CSSProperties => ({ display: "flex", fontWeight: 600, fontSize: size, lineHeight: 1.02, letterSpacing: size * -0.043, color: C.fg })

/** og.png: the window, the top 3 themes and the owner's name. */
export function WeekCard({ data }: { data: WeekData }) {
  return (
    <Frame size={CARD_SIZE} inset={{ x: 56, y: 52 }} title={19}>
      <div style={{ position: "absolute", left: 112, right: 112, top: 98, bottom: 92, display: "flex", flexDirection: "column" }}>
        <div style={kicker(23)}>top themes by accounts, not likes</div>
        <div style={{ ...heading(84), marginTop: 14 }}>{windowLabel(data)}</div>
        <div style={{ display: "flex", marginTop: 42 }}>
          <Rows data={data} count={3} sizes={{ name: 34, count: 24, bar: 18, cells: 39, gap: 22 }} />
        </div>
        <div style={{ display: "flex", marginTop: "auto" }}>
          <Ink style={{ fontWeight: 600, fontSize: 48, lineHeight: 1.15, letterSpacing: -1 }}>{OWNER_NAME}</Ink>
        </div>
      </div>
    </Frame>
  )
}

/** share.png: the same card at 4:5 for image posts, with the top 5 themes, the CVE sentence and the site address. */
export function ShareCard({ data }: { data: WeekData }) {
  const cves = cveSentence(data)
  return (
    <Frame size={SHARE_SIZE} inset={{ x: 56, y: 64 }} title={24}>
      <div style={{ position: "absolute", left: 108, right: 108, top: 132, bottom: 112, display: "flex", flexDirection: "column" }}>
        <div style={kicker(28)}>top themes by accounts, not likes</div>
        <div style={{ ...heading(104), marginTop: 18 }}>{windowLabel(data)}</div>
        {cves ? <div style={{ display: "flex", marginTop: 34, fontSize: 38, lineHeight: 1.35, color: C.muted }}>{cves}</div> : null}
        <div style={{ display: "flex", marginTop: 56 }}>
          <Rows data={data} count={5} stacked sizes={{ name: 40, count: 28, bar: 20, cells: 66, gap: 34 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: "auto", gap: 12 }}>
          <Ink style={{ fontWeight: 600, fontSize: 60, lineHeight: 1.1, letterSpacing: -1.2 }}>{OWNER_NAME}</Ink>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, color: C.muted }}>{SITE_URL.replace(/^https:\/\//, "").replace(/\/$/, "")}</span>
        </div>
      </div>
    </Frame>
  )
}
