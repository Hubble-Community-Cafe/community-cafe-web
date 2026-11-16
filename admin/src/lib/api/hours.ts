import type { BarLocation, DayOfWeek, HoursOverride, WeeklyHours } from '@cafe/shared-web'
import { fetchWithAuth, getJson, deleteResource } from './client'
import { ActionError } from '../actionError'

export interface WeeklyHoursRequest {
  open: string
  close: string
  kitchenOpen: string | null
  kitchenClose: string | null
}

export interface HoursOverrideRequest {
  date: string
  closed: boolean
  open: string | null
  close: string | null
  note: string | null
}

export const fetchWeeklyHours = (bar: BarLocation) =>
  getJson<WeeklyHours[]>(`/api/opening-hours/${bar}`)

export const upsertDay = (bar: BarLocation, day: DayOfWeek, req: WeeklyHoursRequest) =>
  getJson<WeeklyHours>(`/api/admin/opening-hours/${bar}/${day}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

export const closeDay = (bar: BarLocation, day: DayOfWeek) =>
  deleteResource(`/api/admin/opening-hours/${bar}/${day}`, 'the opening hours')

export const fetchOverrides = (bar: BarLocation) =>
  getJson<HoursOverride[]>(`/api/admin/opening-hours/${bar}/overrides`)

/** Send an override, passing the backend's message through (e.g. a date that already has one). */
async function sendOverride(url: string, method: 'POST' | 'PUT', req: HoursOverrideRequest): Promise<HoursOverride> {
  const response = await fetchWithAuth(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string }
    throw new ActionError(err.message ?? 'Could not save the override. Please try again.')
  }
  return response.json() as Promise<HoursOverride>
}

export const createOverride = (bar: BarLocation, req: HoursOverrideRequest) =>
  sendOverride(`/api/admin/opening-hours/${bar}/overrides`, 'POST', req)

/** Change an override's date, status, times or note; the bar stays the same. */
export const updateOverride = (id: number, req: HoursOverrideRequest) =>
  sendOverride(`/api/admin/opening-hours/overrides/${id}`, 'PUT', req)

export const deleteOverride = (id: number) =>
  deleteResource(`/api/admin/opening-hours/overrides/${id}`, 'the special day')
