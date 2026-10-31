import Link from "next/link"

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

export function Header({
  kicker,
  title,
  summary,
  home,
}: {
  kicker?: string
  title: string
  summary?: string
  home?: boolean
}) {
  return (
    <header className="site-header">
      <div className="site-header-top">
        <div className="min-w-0">
          {home ? null : (
            <Link className="home-link" href="/">
              All weeks
            </Link>
          )}
          {kicker ? (
            <p className="window">
              <DateUnits text={kicker} />
            </p>
          ) : null}
        </div>
        <button type="button" data-theme-toggle>
          <span className="only-dark">Light</span>
          <span className="only-light">Dark</span>
        </button>
      </div>
      <h1>{title}</h1>
      {summary ? <p className="summary">{summary}</p> : null}
    </header>
  )
}
