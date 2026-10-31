import type { ComponentType, ReactNode } from "react"
import { coerceProps } from "@/registry/default/graph-comark/coerce"
import type { GraphAdapter } from "@/registry/default/graph-comark/adapters"
import { GraphSpec } from "@/registry/default/graph-spec/graph-spec"
import { GraphStack } from "@/registry/default/graph-stack/graph-stack"
import { GraphTable } from "@/registry/default/graph-table/graph-table"
import { GraphWaffle } from "@/registry/default/graph-waffle/graph-waffle"

function isPresent(value: unknown) {
  if (value == null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "string") return value.trim() !== ""
  return true
}

/** Server-side stand-in for Comark's fromMarkdown. Build props are complete. */
export function adaptGraph(
  Component: ComponentType<Record<string, unknown>>,
  { numeric = [], required = [] }: GraphAdapter = {},
) {
  return function MarkdownGraph(raw: Record<string, unknown>) {
    const props = coerceProps<Record<string, unknown>>(raw, numeric)
    const written = isPresent(props.children)
    if (!written && !required.every((key) => isPresent(props[key]))) return null
    return <Component {...props} />
  }
}

type Cell = string | number | { href?: string; text?: string } | null | undefined

function renderCell(cell: Cell): ReactNode {
  if (cell != null && typeof cell === "object" && typeof cell.href === "string") {
    return <a href={cell.href}>{cell.text ?? ""}</a>
  }
  if (typeof cell === "string") {
    const tag = /^\[ (EXPLOITED|NOT EXPLOITED|NOT CONFIRMED) \]$/.exec(cell)
    if (tag) {
      const hot = tag[1] === "EXPLOITED"
      return <span className={hot ? "tag tag-hot" : "tag tag-muted"}>[ {tag[1]} ]</span>
    }
    return cell
  }
  if (typeof cell === "number") return cell
  return ""
}

type TableRow = Cell[] | { cells?: Cell[]; attrs?: Record<string, string> }

/** GraphTable, with links and CVE state tags restored from the Comark props. */
export function BriefTable(props: { rows?: TableRow[] }) {
  const rows = (props.rows ?? []).map((row) => {
    if (Array.isArray(row)) return row.map((cell) => renderCell(cell))
    return { ...row, cells: (row.cells ?? []).map((cell) => renderCell(cell)) }
  })
  return <GraphTable {...(props as object)} rows={rows} title={String((props as { title?: string }).title ?? "")} />
}

type StackRow = {
  label?: ReactNode
  name?: string
  counts?: string
  segments?: { label?: string; value: number | string }[]
}

/** GraphStack, with the outlet counts on their own muted line. */
export function BriefStack(props: { rows?: StackRow[] }) {
  const rows = (props.rows ?? []).map((row) => {
    if (typeof row.counts !== "string") return row
    const name = typeof row.label === "string" ? row.label : (row.name ?? "")
    return {
      ...row,
      name: row.name ?? name,
      label: (
        <span>
          {name}
          <span className="stack-counts">{row.counts}</span>
        </span>
      ),
    }
  })
  return (
    <GraphStack
      {...(props as object)}
      rows={rows as never}
      title={String((props as { title?: string }).title ?? "")}
    />
  )
}

type SpecRow = {
  label: string
  value?: string
  accent?: boolean
  spark?: string
  summary?: string
}

/** GraphSpec. A row with `spark` is the per-card By day line. */
export function BriefSpec(props: { rows?: SpecRow[] }) {
  const rows = (props.rows ?? []).map((row) => {
    if (typeof row.spark !== "string" || !row.spark) return row
    const glyphs = [...row.spark]
    const last = glyphs.at(-1) ?? ""
    const head = glyphs.slice(0, -1).join("")
    return {
      ...row,
      rich: (
        <>
          <span aria-hidden="true" className="font-mono leading-none">
            <span className="text-graph-muted">{head}</span>
            <span className="text-graph-accent">{last}</span>
          </span>
          <span className="sr-only">{row.summary ?? ""}</span>
        </>
      ),
    }
  })
  return <GraphSpec {...(props as object)} rows={rows} title={String((props as { title?: string }).title ?? "")} />
}

type LegendItem = { key: string; glyph: string; className: string; label: string }

/** GraphWaffle, with the sentiment key inside the frame. */
export function BriefWaffle(props: { legendItems?: LegendItem[]; legend?: ReactNode }) {
  const legend = Array.isArray(props.legendItems) ? (
    <ul className="waffle-key">
      {props.legendItems.map((item) => (
        <li key={item.key}>
          <span aria-hidden="true" className={item.className}>
            {item.glyph}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  ) : (
    props.legend
  )
  return (
    <GraphWaffle
      {...(props as object)}
      legend={legend}
      title={String((props as { title?: string }).title ?? "")}
    />
  )
}
