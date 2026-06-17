import { describe, expect, it } from 'vitest'
import { brandColor, hubble, meteor } from './tokens'

describe('theme tokens', () => {
  it('exposes a full 50..950 scale for each brand', () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    for (const step of steps) {
      expect(hubble[step as keyof typeof hubble]).toMatch(/^#[0-9a-f]{6}$/)
      expect(meteor[step as keyof typeof meteor]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('maps each bar to its primary brand color', () => {
    expect(brandColor.HUBBLE).toBe(hubble[600])
    expect(brandColor.METEOR).toBe(meteor[500])
  })
})
