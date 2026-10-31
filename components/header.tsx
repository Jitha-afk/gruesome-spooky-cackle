import Link from "next/link"

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
              All weeks.
            </Link>
          )}
          {kicker ? <p className="window">{kicker}</p> : null}
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
