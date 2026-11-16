import { expect, it } from 'vitest'

const sources = import.meta.glob<string>(['../**/*.tsx', '../**/*.ts', '!../test/**', '!../**/*.test.*'],
  { query: '?raw', import: 'default', eager: true })

/** Badges were set in 10px, below a readable size. Tailwind's smallest step, text-xs, is 12px. */
it('sets no text below 12px', () => {
  const tooSmall = Object.entries(sources).flatMap(([file, source]) =>
    [...source.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)]
      .filter((match) => Number(match[1]) < 12)
      .map((match) => `${file}: ${match[0]}`))
  expect(Object.keys(sources).length).toBeGreaterThan(10)
  expect(tooSmall).toEqual([])
})
