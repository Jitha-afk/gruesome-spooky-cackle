// A small JSON Schema 2020-12 validator for data-ingestion/schema/week.v1.schema.json. It covers the keywords
// that schema uses: $ref (to #/$defs), type, const, enum, pattern, minimum, maximum, minItems, maxItems,
// uniqueItems, required, properties, additionalProperties and items.
// A node with "$comment": "soft" marks a field the site ignores when it is wrong: record-only fields, the
// optional funnel counts and the proposed fields. Errors at or below a soft node have `soft: true`.
import fs from "node:fs"
import path from "node:path"

export const SCHEMA_PATH = path.join(import.meta.dirname, "..", "data-ingestion", "schema", "week.v1.schema.json")

let cached = null

export function loadSchema() {
  cached ??= JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))
  return cached
}

function is(type, value) {
  if (type === "null") return value === null
  if (type === "array") return Array.isArray(value)
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value)
  if (type === "integer") return Number.isInteger(value)
  if (type === "number") return typeof value === "number" && Number.isFinite(value)
  return typeof value === type
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const join = (where, key) => (typeof key === "number" ? `${where}[${key}]` : where ? `${where}.${key}` : key)
const list = (values) => values.map((value) => JSON.stringify(value)).join(", ")

/**
 * Schema findings for a value: [{ path, message, soft }]. Paths look like themes[0].cves[1], as in lib/check.mjs.
 */
export function schemaErrors(value, schema = loadSchema()) {
  const errors = []
  const visit = (item, node, where, soft) => {
    const isSoft = soft || /^soft\b/.test(node.$comment ?? "")
    const add = (message, at = where) => errors.push({ path: at, message, soft: isSoft })
    if (node.$ref) {
      const target = node.$ref
        .replace(/^#\//, "")
        .split("/")
        .reduce((at, key) => at?.[key], schema)
      if (!target) throw new Error(`The schema has no ${node.$ref}.`)
      visit(item, target, where, isSoft)
    }
    if ("const" in node && !same(item, node.const)) add(`should be ${JSON.stringify(node.const)}.`)
    if (node.enum && !node.enum.some((option) => same(option, item))) add(`should be one of ${list(node.enum)}.`)
    if (node.type && ![].concat(node.type).some((type) => is(type, item))) {
      add(`should be ${[].concat(node.type).join(" or ")}.`)
      return
    }
    if (typeof item === "string" && node.pattern && !new RegExp(node.pattern, "u").test(item)) {
      add(`does not match ${node.pattern}.`)
    }
    if (typeof item === "number") {
      if (node.minimum != null && item < node.minimum) add(`should be ${node.minimum} or more.`)
      if (node.maximum != null && item > node.maximum) add(`should be ${node.maximum} or less.`)
    }
    if (Array.isArray(item)) {
      if (node.minItems != null && item.length < node.minItems) add(`should have at least ${node.minItems} items.`)
      if (node.maxItems != null && item.length > node.maxItems) add(`should have at most ${node.maxItems} items.`)
      if (node.uniqueItems && new Set(item.map((entry) => JSON.stringify(entry))).size !== item.length) {
        add("has repeated items.")
      }
      if (node.items) item.forEach((entry, index) => visit(entry, node.items, join(where, index), isSoft))
    }
    if (is("object", item)) {
      for (const key of node.required ?? []) {
        if (!Object.prototype.hasOwnProperty.call(item, key)) add("is missing.", join(where, key))
      }
      for (const [key, entry] of Object.entries(item)) {
        if (node.properties && Object.prototype.hasOwnProperty.call(node.properties, key)) {
          visit(entry, node.properties[key], join(where, key), isSoft)
        } else if (node.additionalProperties && typeof node.additionalProperties === "object") {
          visit(entry, node.additionalProperties, join(where, key), isSoft)
        }
      }
    }
  }
  visit(value, schema, "", false)
  return errors
}
