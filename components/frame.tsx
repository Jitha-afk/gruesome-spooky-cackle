import type { ReactNode } from "react"

/** `+` marks on the four corners of a dashed frame. */
export function Corners() {
  return (
    <>
      <i aria-hidden="true" className="cn" />
      <i aria-hidden="true" className="cn cn-b" />
    </>
  )
}

function Title({ children }: { children: ReactNode }) {
  return <span className="graph-title-ink">[ {children} ]</span>
}

/** A dashed mdxcn frame with a centred `[ TITLE ]`. */
export function Frame({
  title,
  className,
  children,
}: {
  title?: string
  className?: string
  children: ReactNode
}) {
  return (
    <figure className={className ? `frame ${className}` : "frame"}>
      {title ? (
        <figcaption className="frame-title">
          <Title>{title}</Title>
        </figcaption>
      ) : null}
      <Corners />
      {children}
    </figure>
  )
}

/** Same frame for lists and accordions. Not a figure. */
export function Box({ title, className, children }: { title?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className ? `frame ${className}` : "frame"}>
      {title ? (
        <p aria-hidden="true" className="frame-title">
          <Title>{title}</Title>
        </p>
      ) : null}
      <Corners />
      {children}
    </div>
  )
}

export function SectionHead({
  id,
  kicker,
  title,
  lead,
  action,
}: {
  id: string
  kicker: string
  title: ReactNode
  lead?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className={action ? "sec-head has-action" : "sec-head"}>
      <p className="kicker">{kicker}</p>
      <h2 id={`${id}-title`}>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
      {action ? <div className="sec-action">{action}</div> : null}
    </header>
  )
}
