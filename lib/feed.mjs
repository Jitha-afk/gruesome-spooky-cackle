// Atom feed of the data weeks, newest first. The route in app/feed.xml writes it at build time.
import { heroLead, isRealDay, weekTitle } from "./brief.mjs"

const IST = /^(\d{4}-\d{2}-\d{2}) ([01]\d|2[0-3]):([0-5]\d) IST$/

function escapeXml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function istStamp(text) {
  const match = typeof text === "string" ? IST.exec(text.trim()) : null
  if (!match || !isRealDay(match[1])) return null
  return `${match[1]}T${match[2]}:${match[3]}:00+05:30`
}

/** RFC 3339 time of a week: meta.generated, else the window end. Both are IST. */
export function weekUpdated(data) {
  return (
    istStamp(data.meta.generated) ?? istStamp(data.meta.window.end) ?? `${data.meta.window.end.slice(0, 10)}T23:59:00+05:30`
  )
}

/**
 * The feed XML. `site.url` is the absolute site URL with a trailing slash.
 * @param {import("./brief.mjs").WeekRecord[]} weeks
 * @param {{ url: string, title: string, subtitle: string, author: { name: string, uri: string } }} site
 */
export function atomFeed(weeks, site) {
  const entries = weeks
    .filter((week) => week.kind === "data" && week.data)
    .sort((a, b) => b.end - a.end || b.start - a.start)
    .map((week) => {
      const url = `${site.url}reports/${week.name}/`
      const updated = weekUpdated(week.data)
      return { url, updated, title: weekTitle(week.data), summary: heroLead(week.data) }
    })
  const newest = entries.map((entry) => entry.updated).sort((a, b) => Date.parse(b) - Date.parse(a))[0]
  const lines = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <title>${escapeXml(site.title)}</title>`,
    `  <subtitle>${escapeXml(site.subtitle)}</subtitle>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(site.url)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(`${site.url}feed.xml`)}"/>`,
    `  <id>${escapeXml(site.url)}</id>`,
    `  <updated>${newest ?? "1970-01-01T00:00:00Z"}</updated>`,
    `  <author>`,
    `    <name>${escapeXml(site.author.name)}</name>`,
    `    <uri>${escapeXml(site.author.uri)}</uri>`,
    `  </author>`,
  ]
  for (const entry of entries) {
    lines.push(
      `  <entry>`,
      `    <title>${escapeXml(entry.title)}</title>`,
      `    <link rel="alternate" type="text/html" href="${escapeXml(entry.url)}"/>`,
      `    <id>${escapeXml(entry.url)}</id>`,
      `    <published>${entry.updated}</published>`,
      `    <updated>${entry.updated}</updated>`,
      `    <summary type="text">${escapeXml(entry.summary)}</summary>`,
      `  </entry>`,
    )
  }
  lines.push(`</feed>`, ``)
  return lines.join("\n")
}
