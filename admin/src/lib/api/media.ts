import type { BarLocation } from '@cafe/shared-web'
import { deleteResource, fetchWithAuth, getJson } from './client'
import { MAX_UPLOAD_LABEL } from '../upload'

// ── Media types ─────────────────────────────────────────────────────────────────
export interface MediaAsset {
  id: number
  filename: string
  contentType: string
  url: string
  alt: string | null
  sizeBytes: number | null
  bar: BarLocation | null
  createdAt: string
}

// ── Media endpoints ────────────────────────────────────────────────────────────
export const fetchAllMedia = () =>
  getJson<MediaAsset[]>('/api/admin/media')

export const uploadMedia = async (file: File, alt?: string, bar?: BarLocation | null): Promise<MediaAsset> => {
  const form = new FormData()
  form.append('file', file)
  if (alt) form.append('alt', alt)
  if (bar) form.append('bar', bar)
  const response = await fetchWithAuth('/api/admin/media', { method: 'POST', body: form })
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string }
    if (err.message) throw new Error(err.message)
    // A proxy in front of the backend can reject an oversize body before Spring sees it, in
    // which case there is no JSON message to show. Say something human anyway.
    if (response.status === 413) {
      throw new Error(
        `That image is too large to upload. The maximum is ${MAX_UPLOAD_LABEL}. `
        + 'Please resize or compress it and try again.',
      )
    }
    throw new Error(`Upload failed (${response.status}). Please try again.`)
  }
  return response.json() as Promise<MediaAsset>
}

/**
 * Delete an image. Rejects with the backend's message when that refuses, for example a 409 naming
 * the event or item that still shows the image, so the page can tell staff what to change first.
 */
export const deleteMedia = (id: number) =>
  deleteResource(`/api/admin/media/${id}`, 'the image')
