import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installChunkReload } from './chunkReload'

function fakeWindow() {
  const listeners: ((event: Event) => void)[] = []
  const store = new Map<string, string>()
  const target = {
    addEventListener: vi.fn((_type: string, listener: (event: Event) => void) => listeners.push(listener)),
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
    },
    location: { reload: vi.fn() },
  }
  const fire = () => {
    const event = new Event('vite:preloadError', { cancelable: true })
    listeners.forEach((l) => l(event))
    return event
  }
  return { target, fire }
}

describe('installChunkReload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-28T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('reloads once when a page chunk of an older build fails to load', () => {
    const { target, fire } = fakeWindow()
    installChunkReload(target as unknown as Window)

    const event = fire()

    expect(target.addEventListener).toHaveBeenCalledWith('vite:preloadError', expect.any(Function))
    expect(target.location.reload).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('lets a second failure right after the reload through, instead of reloading in a loop', () => {
    const { target, fire } = fakeWindow()
    installChunkReload(target as unknown as Window)
    fire()

    vi.advanceTimersByTime(3_000)
    const second = fire()

    expect(target.location.reload).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(false)
  })

  it('reloads again for a later deploy, once the guard window has passed', () => {
    const { target, fire } = fakeWindow()
    installChunkReload(target as unknown as Window)
    fire()

    vi.advanceTimersByTime(60_000)
    fire()

    expect(target.location.reload).toHaveBeenCalledTimes(2)
  })
})
