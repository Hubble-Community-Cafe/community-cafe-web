/** Colour the screens use when no colour is entered. */
export const DEFAULT_COLOUR = '#FFFFFF'

const HEX = /^#?[0-9A-Fa-f]{6}$/

/** A complete six-digit hex as `#RRGGBB`, or null while the value is empty or incomplete. */
export function normaliseHex(value: string): string | null {
  const v = value.trim()
  return HEX.test(v) ? `#${v.replace('#', '').toUpperCase()}` : null
}
