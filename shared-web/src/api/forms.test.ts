import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FormError, submitScreenForm, type UploadProgress } from './forms'

/** Just enough of XMLHttpRequest to drive the upload by hand. */
class FakeXhr {
  static last: FakeXhr
  method = ''
  url = ''
  body: unknown
  status = 0
  responseText = ''
  upload: { onprogress?: (e: ProgressEvent) => void; onload?: () => void } = {}
  onload?: () => void
  onerror?: () => void
  ontimeout?: () => void
  onabort?: () => void

  constructor() {
    FakeXhr.last = this
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  send(body: unknown) {
    this.body = body
  }

  progress(loaded: number, total: number, lengthComputable = true) {
    this.upload.onprogress?.({ loaded, total, lengthComputable } as ProgressEvent)
  }

  respond(status: number, text = '') {
    this.upload.onload?.()
    this.status = status
    this.responseText = text
    this.onload?.()
  }
}

describe('submitScreenForm with progress', () => {
  const original = globalThis.XMLHttpRequest

  beforeEach(() => {
    globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest
  })

  afterEach(() => {
    globalThis.XMLHttpRequest = original
  })

  const start = () => {
    const progress: UploadProgress[] = []
    const data = new FormData()
    data.append('name', 'Jamie')
    const result = submitScreenForm(data, (p) => progress.push(p))
    return { progress, result, data, xhr: FakeXhr.last }
  }

  it('posts the form data and reports the upload, then the server check', async () => {
    const { progress, result, data, xhr } = start()
    expect(xhr.method).toBe('POST')
    expect(xhr.url).toBe('http://localhost:8080/api/forms/screen')
    expect(xhr.body).toBe(data)

    xhr.progress(5, 10)
    xhr.progress(10, 10)
    xhr.respond(204)

    await expect(result).resolves.toBeUndefined()
    expect(progress).toEqual([
      { phase: 'uploading', percent: 0 },
      { phase: 'uploading', percent: 50 },
      { phase: 'uploading', percent: 100 },
      { phase: 'processing' },
    ])
  })

  it('reports no percentage when the browser does not know the size', () => {
    const { progress, xhr } = start()
    xhr.progress(5, 0, false)
    expect(progress.at(-1)).toEqual({ phase: 'uploading', percent: null })
  })

  it("surfaces the backend's message on a rejection", async () => {
    const { result, xhr } = start()
    xhr.respond(400, JSON.stringify({ message: 'We could not read your poster.' }))
    await expect(result).rejects.toEqual(new FormError('We could not read your poster.'))
  })

  it('falls back to a generic message when the error has no body', async () => {
    const { result, xhr } = start()
    xhr.respond(502, '<html>Bad gateway</html>')
    await expect(result).rejects.toEqual(new FormError('Something went wrong. Please try again.'))
  })

  it('explains a rate limit', async () => {
    const { result, xhr } = start()
    xhr.respond(429)
    await expect(result).rejects.toThrow('Too many submissions')
  })

  it.each(['onerror', 'ontimeout', 'onabort'] as const)('reports a network failure (%s)', async (event) => {
    const { result, xhr } = start()
    xhr[event]?.()
    await expect(result).rejects.toThrow('Could not reach the server')
  })
})

describe('submitScreenForm without progress', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('still uses a plain fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    globalThis.fetch = fetchMock as typeof fetch
    await submitScreenForm(new FormData())
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/forms/screen',
      expect.objectContaining({ method: 'POST' }))
  })

  it("surfaces the backend's message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'association must not be blank' }), { status: 400 }),
    ) as typeof fetch
    await expect(submitScreenForm(new FormData())).rejects.toThrow('association must not be blank')
  })
})
