import type { Tone } from "@/components/glyph"

/**
 * Fixed tones so a value keeps its glyph across charts. New values fall back in order.
 * Like mdxcn, data uses the primary and secondary accent, then muted and faint.
 * Red (tone d) is reserved for exploited CVEs and negative comments, so the
 * third accent stop, red in prism, never marks data.
 * Numbers use the same tones: a count takes the tone of the part it counts.
 */
const TYPE: Record<string, Tone> = { vendor: "a", media: "b", independent: "m" }
const PLATFORM: Record<string, Tone> = { X: "n", YouTube: "m" }
const SPARE: Tone[] = ["b", "a", "f"]

function pick(map: Record<string, Tone>, key: string, index: number, spare: Tone[]): Tone {
  return map[key] ?? spare[Math.min(index, spare.length - 1)]
}

export function typeTone(key: string, keys: string[]): Tone {
  const extra = keys.filter((item) => !(item in TYPE))
  return pick(TYPE, key, extra.indexOf(key), ["n", "f"])
}

export function platformTone(key: string, keys: string[]): Tone {
  const extra = keys.filter((item) => !(item in PLATFORM))
  return pick(PLATFORM, key, extra.indexOf(key), SPARE)
}

export const SENTIMENT: { key: "positive" | "neutral" | "negative" | "unclassified"; tone: Tone }[] = [
  { key: "positive", tone: "a" },
  { key: "neutral", tone: "m" },
  { key: "negative", tone: "d" },
  { key: "unclassified", tone: "f" },
]

export function pad(rank: number) {
  return String(rank).padStart(2, "0")
}

/** Glyph class for a CVE state: exploited, not confirmed, not exploited. */
export function cveGlyph(flag: boolean | null) {
  if (flag === true) return "g-hot"
  if (flag === null) return "g-open"
  return "g-cold"
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`
}
