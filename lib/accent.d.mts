export type AccentKind = "solid" | "gradient"
export type Accent = { id: string; kind: AccentKind; swatch: string }

export const ACCENT_KEY: string
export const DEFAULT_ACCENT: string
export const accents: Accent[]
export function accentBoot(): string
