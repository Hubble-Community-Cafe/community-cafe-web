import type { BarLocation, Vacancy as SharedVacancy } from '@cafe/shared-web'
import { fetchWithAuth, getJson, sendNoContent } from './client'

// ── Vacancy types ──────────────────────────────────────────────────────────────
export interface Vacancy extends SharedVacancy {
  imageId: number | null
}

export interface VacancyRequest {
  title: string
  description: string | null
  hours: string | null
  type: string | null
  applyEmail: string | null
  applyLink: string | null
  imageId: number | null
  bar: BarLocation | null
  active: boolean
  /** Omit to append on create, or to leave the position alone on update. Set by dragging. */
  sortOrder?: number | null
}

// ── Vacancy endpoints ──────────────────────────────────────────────────────────
export const fetchVacancies = () =>
  getJson<Vacancy[]>('/api/admin/vacancies')

export const createVacancy = (req: VacancyRequest) =>
  getJson<Vacancy>('/api/admin/vacancies', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateVacancy = (id: number, req: VacancyRequest) =>
  getJson<Vacancy>(`/api/admin/vacancies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteVacancy = (id: number) =>
  fetchWithAuth(`/api/admin/vacancies/${id}`, { method: 'DELETE' })

/** Apply a dragged order. See reorderMenuCategories for why this is its own call. */
export const reorderVacancies = (orderedIds: number[]) =>
  sendNoContent('/api/admin/vacancies/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })
