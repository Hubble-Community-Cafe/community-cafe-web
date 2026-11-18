import { describe, it, expect } from 'vitest'
import { barDaysFrom, barToday } from '../lib/barDate'

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

describe('barDaysFrom', () => {
  it('counts from the bars’ date, not the UTC one, just after midnight in Amsterdam', () => {
    // 00:30 on 17 November in Amsterdam, still the 16th in UTC.
    expect(barDaysFrom(0, new Date('2026-11-16T23:30:00Z'))).toBe('2026-11-17')
    expect(barDaysFrom(14, new Date('2026-11-16T23:30:00Z'))).toBe('2026-12-01')
  })

  it('stays on the calendar across the switch to winter time and across a year end', () => {
    expect(barDaysFrom(7, new Date('2026-10-22T12:00:00Z'))).toBe('2026-10-29')
    expect(barDaysFrom(14, new Date('2026-12-25T12:00:00Z'))).toBe('2027-01-08')
  })
})
