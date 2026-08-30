import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchWithRetry, getApiBaseUrl, getJson } from './client'

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const errorResponse = (status: number) => new Response('', { status })

describe('getApiBaseUrl', () => {
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__
  })

  it('prefers a substituted runtime config value', () => {
    window.__RUNTIME_CONFIG__ = { API_URL: 'https://api.example.test' }
    expect(getApiBaseUrl()).toBe('https://api.example.test')
  })

  it('ignores an unsubstituted placeholder and falls back to env', () => {
    window.__RUNTIME_CONFIG__ = { API_URL: '__API_URL__' }
    // The vitest config provides VITE_PUBLIC_API_URL via the test env below.
    expect(getApiBaseUrl()).toBe('http://localhost:8080')
  })
})

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.fetch = vi.fn() as typeof fetch
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns immediately on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ ok: true }))
    const res = await fetchWithRetry('/x')
    expect(res.ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on a retryable status then succeeds', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse({ ok: true }))
    const promise = fetchWithRetry('/x')
    await vi.advanceTimersByTimeAsync(1000)
    const res = await promise
    expect(res.ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-retryable status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    const res = await fetchWithRetry('/x')
    expect(res.status).toBe(404)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('gives up after maxAttempts on persistent failure', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(500))
    const promise = fetchWithRetry('/x', undefined, 3)
    await vi.advanceTimersByTimeAsync(3000)
    const res = await promise
    expect(res.status).toBe(500)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

describe('getJson', () => {
  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { API_URL: 'https://api.example.test' }
    globalThis.fetch = vi.fn() as typeof fetch
  })

  afterEach(() => {
    delete window.__RUNTIME_CONFIG__
    vi.restoreAllMocks()
  })

  it('builds the URL from the base and parses JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ value: 42 }))
    const data = await getJson<{ value: number }>('/api/thing')
    expect(data).toEqual({ value: 42 })
    expect(fetch).toHaveBeenCalledWith('https://api.example.test/api/thing', undefined)
  })

  it('throws on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(500))
    await expect(getJson('/api/thing')).rejects.toThrow(/failed/i)
  })

  it('classifies a non-ok response as an http failure carrying the status', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(404))
    const error = await getJson('/api/thing').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 404, path: '/api/thing' })
  })

  it('classifies an unreachable API as a network failure', async () => {
    const cause = new TypeError('Failed to fetch')
    vi.mocked(fetch).mockRejectedValue(cause)
    const error = await getJson('/api/thing').catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'network', status: null })
    expect((error as ApiError).cause).toBe(cause)
  })

  it('classifies an unreadable body as a parse failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const error = await getJson('/api/thing').catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'parse', status: 200 })
  })

  it('classifies a missing base URL as a config failure', async () => {
    delete window.__RUNTIME_CONFIG__
    vi.stubEnv('VITE_PUBLIC_API_URL', '')
    const error = await getJson('/api/thing').catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'config' })
    vi.unstubAllEnvs()
  })
})
