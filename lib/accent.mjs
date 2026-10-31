// Accent families from mdxcn (MIT, shadcn-labs/mdxcn lib/accent.ts).
// The light and dark values live in app/globals.css as html[data-accent] rules.
// This list drives the picker swatches and the boot script.

export const ACCENT_KEY = "graph-accent"
export const DEFAULT_ACCENT = "prism"

function gradient(angle, a, b, c, mid) {
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} ${mid}%, ${c} 100%)`
}

export const accents = [
  { id: "theme", kind: "solid", swatch: "oklch(0.92 0 0)" },
  { id: "mint", kind: "solid", swatch: "oklch(0.77 0.15 163)" },
  { id: "orange", kind: "solid", swatch: "oklch(0.76 0.14 55)" },
  { id: "green", kind: "solid", swatch: "oklch(0.74 0.14 145)" },
  { id: "cyan", kind: "solid", swatch: "oklch(0.76 0.1 210)" },
  { id: "blue", kind: "solid", swatch: "oklch(0.7 0.12 255)" },
  { id: "purple", kind: "solid", swatch: "oklch(0.72 0.12 300)" },
  { id: "pink", kind: "solid", swatch: "oklch(0.74 0.14 8)" },
  {
    id: "sunset",
    kind: "gradient",
    swatch: gradient(135, "oklch(0.7 0.19 19)", "oklch(0.86 0.12 74)", "oklch(0.92 0.1 89)", 52),
  },
  {
    id: "ocean",
    kind: "gradient",
    swatch: gradient(140, "oklch(0.77 0.15 228)", "oklch(0.59 0.23 259)", "oklch(0.72 0.15 248)", 48),
  },
  {
    id: "neon",
    kind: "gradient",
    swatch: gradient(145, "oklch(0.92 0.23 129)", "oklch(0.89 0.18 162)", "oklch(0.8 0.15 220)", 46),
  },
  {
    id: "aurora",
    kind: "gradient",
    swatch: gradient(145, "oklch(0.68 0.25 351)", "oklch(0.5 0.14 307)", "oklch(0.6 0.13 244)", 45),
  },
  {
    id: "fire",
    kind: "gradient",
    swatch: gradient(145, "oklch(0.67 0.22 33)", "oklch(0.59 0.22 1)", "oklch(0.82 0.15 72)", 45),
  },
  {
    id: "prism",
    kind: "gradient",
    swatch: gradient(145, "oklch(0.75 0.14 220)", "oklch(0.69 0.19 313)", "oklch(0.66 0.2 21)", 45),
  },
]

/** Inline boot code. Sets data-accent and data-accent-kind before paint. */
export function accentBoot() {
  const ids = JSON.stringify(accents.map((accent) => accent.id))
  const solids = JSON.stringify(accents.filter((accent) => accent.kind === "solid").map((accent) => accent.id))
  return `var a=${JSON.stringify(DEFAULT_ACCENT)};try{var b=localStorage.getItem(${JSON.stringify(ACCENT_KEY)});if(${ids}.indexOf(b)>-1)a=b;}catch(e){}h.setAttribute("data-accent",a);h.setAttribute("data-accent-kind",${solids}.indexOf(a)>-1?"solid":"gradient");`
}
