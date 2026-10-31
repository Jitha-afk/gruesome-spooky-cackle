/** Shared log ramp. Zero stays empty. A positive count is at least step 1. */
export function logIntensityLevel(value, max) {
  if (value <= 0 || max <= 0) return 0
  const scaled = Math.log1p(value) / Math.log1p(max)
  return Math.max(1, Math.round(Math.min(1, scaled) * 4))
}
