// The share card of a week, 1200×630, drawn by next/og at build time. It uses only data.json.
import fs from "node:fs"
import path from "node:path"
import type { CSSProperties } from "react"
import { formatCount, shortLabel, themesByRank, windowLabel, type WeekData } from "./brief.mjs"
import { CARD_SIZE, OWNER_NAME, SITE_NAME } from "./site"

// Satori cannot read woff2, so the card uses the TTFs of the geist package.
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
const BAR_COLOURS = [C.a, C.b, C.c]
const MONO = "Geist Mono"
const INSET = { top: 52, right: 56, bottom: 52, left: 56 }
// Bars are cells of 9px with 3px gaps, as the bracket bars on the site.
const CELL = 12
const CELLS = 39
const TRACK = CELLS * CELL - 3
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

export function WeekCard({ data }: { data: WeekData }) {
  const { width, height } = CARD_SIZE
  const right = width - INSET.right
  const bottom = height - INSET.bottom
  const top = themesByRank(data).slice(0, 3)
  const max = Math.max(...top.map((theme) => theme.distinct_accounts), 1)
  return (
    <div style={{ width, height, display: "flex", position: "relative", background: C.bg, color: C.fg, fontFamily: "Geist" }}>
      <Line vertical colour={C.rail} style={{ left: 28, top: 0, width: 1, height }} />
      <Line vertical colour={C.rail} style={{ left: width - 29, top: 0, width: 1, height }} />
      <Line colour={C.frame} style={{ left: INSET.left, top: INSET.top, width: right - INSET.left, height: 1 }} />
      <Line colour={C.frame} style={{ left: INSET.left, top: bottom, width: right - INSET.left, height: 1 }} />
      <Line vertical colour={C.frame} style={{ left: INSET.left, top: INSET.top, width: 1, height: bottom - INSET.top }} />
      <Line vertical colour={C.frame} style={{ left: right, top: INSET.top, width: 1, height: bottom - INSET.top }} />
      <Plus x={INSET.left} y={INSET.top} />
      <Plus x={right} y={INSET.top} />
      <Plus x={INSET.left} y={bottom} />
      <Plus x={right} y={bottom} />
      <div style={{ position: "absolute", left: 0, top: INSET.top - 14, width, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", padding: "0 14px", background: C.bg, fontFamily: MONO, fontWeight: 500, fontSize: 19, lineHeight: 1.4, letterSpacing: 1.5 }}>
          <Ink style={{ textTransform: "uppercase" }}>{`[ ${SITE_NAME} report ]`}</Ink>
        </div>
      </div>
      <div style={{ position: "absolute", left: 112, right: 112, top: 98, bottom: 92, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: MONO, fontWeight: 500, fontSize: 23, lineHeight: 1.3, letterSpacing: 0.5, color: C.a }}>
          top themes by accounts, not likes
        </div>
        <div style={{ display: "flex", marginTop: 14, fontWeight: 600, fontSize: 84, lineHeight: 1.02, letterSpacing: -3.6, color: C.fg }}>
          {windowLabel(data)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 42, gap: 22 }}>
          {top.map((theme, index) => {
            const count = theme.distinct_accounts
            return (
              <div key={theme.key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-end", flexGrow: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", lineHeight: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 34, letterSpacing: -0.6, color: C.fg }}>{shortLabel(theme.name, theme.short_name)}</span>
                  <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, color: C.muted, marginLeft: 12, marginBottom: 2 }}>
                    {`· ${formatCount(count)} ${count === 1 ? "account" : "accounts"}`}
                  </span>
                </div>
                <div style={{ display: "flex", flexShrink: 0, alignItems: "center", fontFamily: MONO, fontWeight: 500, fontSize: 23, color: C.muted }}>
                  <span>[</span>
                  <div style={{ display: "flex", width: TRACK, height: 18, margin: "0 10px", backgroundImage: cells(C.track) }}>
                    <div
                      style={{
                        display: "flex",
                        width: Math.max(1, Math.round((count / max) * CELLS)) * CELL - 3,
                        height: 18,
                        backgroundImage: cells(BAR_COLOURS[index]),
                      }}
                    />
                  </div>
                  <span>]</span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: "flex", marginTop: "auto" }}>
          <Ink style={{ fontWeight: 600, fontSize: 48, lineHeight: 1.15, letterSpacing: -1 }}>{OWNER_NAME}</Ink>
        </div>
      </div>
    </div>
  )
}
