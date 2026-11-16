import type { BarLocation, Association } from '@cafe/shared-web'
import { fetchWithAuth, getJson } from './client'

// ── Association types ──────────────────────────────────────────────────────────

export interface AssociationRequest {
  name: string
  logoId: number | null
  bar: BarLocation | null
}

// ── Association endpoints ──────────────────────────────────────────────────────
export const fetchAssociations = () =>
  getJson<Association[]>('/api/admin/associations')

export const createAssociation = (req: AssociationRequest) =>
  getJson<Association>('/api/admin/associations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

export const updateAssociation = (id: number, req: AssociationRequest) =>
  getJson<Association>(`/api/admin/associations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

export const deleteAssociation = (id: number) =>
  fetchWithAuth(`/api/admin/associations/${id}`, { method: 'DELETE' })
