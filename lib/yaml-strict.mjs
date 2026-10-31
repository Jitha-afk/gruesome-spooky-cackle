// YAML 1.2 core schema: quoted values stay strings, and timestamps are not a type.
import { parse } from "yaml"

export function parseStrictYaml(text) {
  if (typeof text !== "string") {
    throw new TypeError("YAML text must be a string.")
  }
  return parse(text, {
    schema: "core",
    strict: true,
    intAsBigInt: false,
  })
}
