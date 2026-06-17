/**
 * Design tokens as TypeScript constants, mirroring `theme.css`.
 *
 * Use these where a value is needed outside Tailwind (inline styles, canvas,
 * meta theme-color, tests). The CSS `@theme` block is the source of truth for
 * utility classes; keep the two in sync when a token changes.
 */

export const hubble = {
  50: '#e8f7f9',
  100: '#bde8ec',
  200: '#98dce3',
  300: '#62cad3',
  400: '#3ebbc6',
  500: '#2b7184',
  600: '#0f4d64',
  700: '#0c3d50',
  800: '#092d3b',
  900: '#061d27',
  950: '#030f14',
} as const

export const meteor = {
  50: '#e8f0ed',
  100: '#c5d9d0',
  200: '#9fc1b3',
  300: '#78a996',
  400: '#52917a',
  500: '#053826',
  600: '#042d1e',
  700: '#032217',
  800: '#021610',
  900: '#010b08',
  950: '#343436',
  accent: '#9b8d6f',
  text: '#7a7a7a',
} as const

export const fonts = {
  sans: "'Lato', system-ui, sans-serif",
  body: "'Lato', system-ui, sans-serif",
  display: "'AXIS', 'Lato', system-ui, sans-serif",
  title: "'AXIS', 'Lato', system-ui, sans-serif",
} as const

/** The primary brand color per site, handy for meta theme-color and accents. */
export const brandColor = {
  HUBBLE: hubble[600],
  METEOR: meteor[500],
} as const
