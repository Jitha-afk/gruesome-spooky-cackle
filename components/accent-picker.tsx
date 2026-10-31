import { DEFAULT_ACCENT, accents } from "@/lib/accent.mjs"

/**
 * mdxcn accent picker as one radio group: one tab stop, arrow keys move.
 * `name` keeps each copy on the page its own group. site.js sets the accent.
 * Hidden until JS runs.
 */
export function AccentPicker({ name }: { name: string }) {
  const solid = accents.filter((accent) => accent.kind === "solid")
  const gradient = accents.filter((accent) => accent.kind === "gradient")
  const swatch = (accent: (typeof accents)[number]) => {
    const label = accent.id === "theme" ? "neutral" : accent.id
    return (
      <label className="swatch" key={accent.id} title={label}>
        <input
          aria-label={label}
          className="sr-only"
          data-accent-set={accent.id}
          data-kind={accent.kind}
          defaultChecked={accent.id === DEFAULT_ACCENT}
          name={name}
          type="radio"
          value={accent.id}
        />
        <i aria-hidden="true" style={{ background: accent.id === "theme" ? "var(--foreground)" : accent.swatch }} />
      </label>
    )
  }
  return (
    <div className="picker js-only">
      <p className="kicker">accent</p>
      <div aria-label="Accent colour" className="swatches" role="radiogroup">
        {solid.map(swatch)}
        <span aria-hidden="true" className="swatch-sep" />
        {gradient.map(swatch)}
      </div>
    </div>
  )
}
