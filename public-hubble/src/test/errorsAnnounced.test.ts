import { expect, it } from 'vitest'
import { unannouncedErrors } from '@cafe/shared-web/testing/forms'

const sources = import.meta.glob<string>(['../**/*.tsx', '!../test/**', '!../**/*.test.tsx'],
  { query: '?raw', import: 'default', eager: true })

/** A failed load or save that appears later is only read out to screen reader users as an alert. */
it('marks every error message as an alert', () => {
  expect(Object.keys(sources).length).toBeGreaterThan(10)
  expect(unannouncedErrors(sources)).toEqual([])
})
