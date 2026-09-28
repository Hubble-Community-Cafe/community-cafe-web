/**
 * Accessibility violations that existed when the axe checks were added, per page, so the suite
 * fails only on new ones. Key: "<playwright project> <route>" (or "<route> errors" for a form
 * submitted empty); value: axe rule ids tolerated on that page. Fix these and remove them; the
 * goal is an empty list.
 */
export const KNOWN_A11Y_ISSUES: Record<string, string[]> = {}
