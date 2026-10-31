import { DEFAULT_ACCENT, accents } from "@/lib/accent.mjs"

/** mdxcn accent picker. site.js sets the accent. Hidden until JS runs. */
export function AccentPicker() {
  const solid = accents.filter((accent) => accent.kind === "solid")
  const gradient = accents.filter((accent) => accent.kind === "gradient")
  const swatch = (accent: (typeof accents)[number]) => (
    <button
      aria-label={accent.id}
      aria-pressed={accent.id === DEFAULT_ACCENT}
      className="swatch"
      data-accent-set={accent.id}
      data-kind={accent.kind}
      key={accent.id}
      title={accent.id}
      type="button"
    >
      <i style={{ background: accent.id === "theme" ? "var(--foreground)" : accent.swatch }} />
    </button>
  )
  return (
    <div className="picker js-only">
      <p className="kicker">accent</p>
      <div aria-label="Accent colour" className="swatches" role="group">
        {solid.map(swatch)}
        <span aria-hidden="true" className="swatch-sep" />
        {gradient.map(swatch)}
      </div>
    </div>
  )
}
