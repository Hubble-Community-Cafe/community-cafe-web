import { describe, it, expect } from 'vitest'
import { barToday } from '../lib/barDate'

describe('barToday', () => {
  it('gives the Amsterdam date when UTC is still on the previous day (summer time)', () => {
    expect(barToday(new Date('2026-10-12T22:01:00Z'))).toBe('2026-10-13')
  })

  it('gives the Amsterdam date when UTC is still on the previous day (winter time)', () => {
    expect(barToday(new Date('2026-01-31T23:30:00Z'))).toBe('2026-02-01')
  })

  it('matches the UTC date during the day', () => {
    expect(barToday(new Date('2026-10-12T12:00:00Z'))).toBe('2026-10-12')
  })
})
