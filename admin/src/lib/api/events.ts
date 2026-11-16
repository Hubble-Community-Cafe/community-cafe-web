import type { BarLocation, CafeEvent } from '@cafe/shared-web'
import { fetchWithAuth, getJson } from './client'

// ── Event types ─────────────────────────────────────────────────────────────────

export interface EventRequest {
  bar: BarLocation
  title: string
  description: string | null
  date: string
  startTime: string | null
  price: string | null
  subscribeLink: string | null
  imageId: number | null
  published: boolean
}

// ── Event endpoints ────────────────────────────────────────────────────────────
export const fetchEvents = (bar: BarLocation) =>
  getJson<CafeEvent[]>(`/api/admin/events/${bar}`)

export const createEvent = (req: EventRequest) =>
  getJson<CafeEvent>('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateEvent = (id: number, req: EventRequest) =>
  getJson<CafeEvent>(`/api/admin/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteEvent = (id: number) =>
  fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' })
