import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApiResource } from './useApiResource'

describe('useApiResource', () => {
  it('starts with the initial data, then holds what was loaded', async () => {
    const { result } = renderHook(() => useApiResource(() => Promise.resolve(['a', 'b']), [] as string[], vi.fn()))

    expect(result.current).toEqual({ data: [], loaded: false, error: false })
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current).toEqual({ data: ['a', 'b'], loaded: true, error: false })
  })

  it('reports a failure through the caller and keeps the initial data', async () => {
    const failure = new Error('down')
    const onError = vi.fn()
    const { result } = renderHook(() => useApiResource(() => Promise.reject(failure), [] as string[], onError))

    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current).toEqual({ data: [], loaded: true, error: true })
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it('loads once, not again on every render', async () => {
    const load = vi.fn(() => Promise.resolve(1))
    const { result, rerender } = renderHook(() => useApiResource(load, 0, vi.fn()))

    await waitFor(() => expect(result.current.loaded).toBe(true))
    rerender()
    rerender()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('drops a response that arrives after unmounting, but still reports a failure', async () => {
    let fail: (err: unknown) => void = () => {}
    const onError = vi.fn()
    const { result, unmount } = renderHook(() =>
      useApiResource(() => new Promise<number>((_, reject) => { fail = reject }), 0, onError))

    unmount()
    fail(new Error('late'))
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(result.current).toEqual({ data: 0, loaded: false, error: false })
  })
})
