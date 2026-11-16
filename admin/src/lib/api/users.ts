import { getJson } from './client'

// ── Types (mirror the backend DTOs) ────────────────────────────────────────────
export type AdminRole = 'STAFF' | 'ADMIN'

/** An admin tab (or part of one) access is granted on; mirrors the backend AdminModule enum. */
export type AdminModule =
  | 'MENU' | 'DAILY_DISH' | 'OPENING_HOURS' | 'EVENTS' | 'BOARD' | 'VACANCIES'
  | 'ASSOCIATIONS' | 'MEDIA' | 'SCREENS' | 'SCREEN_POSTERS'

export type AccessLevel = 'HIDDEN' | 'VIEW' | 'EDIT'

export interface AdminUser {
  id: number
  email: string
  displayName: string | null
  role: AdminRole
  /** Full access, including users and the audit log. */
  admin: boolean
  /** The effective level per module, every module listed (EDIT everywhere for an admin). */
  permissions: Record<AdminModule, AccessLevel>
}

export interface AuditLogEntry {
  id: number
  entityType: string
  entityId: number | null
  entityLabel: string | null
  action: string
  actorEmail: string | null
  actorName: string | null
  changes: string | null
  summary: string | null
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ── Admin endpoints ────────────────────────────────────────────────────────────
export const fetchCurrentUser = () => getJson<AdminUser>('/api/admin/users/me')

export const fetchAllUsers = () => getJson<AdminUser[]>('/api/admin/users')

/** Set someone's admin switch and per-tab access. Tabs left out are hidden. */
export const updateUserAccess = (
  userId: number,
  access: { admin: boolean; permissions: Partial<Record<AdminModule, AccessLevel>> },
) =>
  getJson<AdminUser>(`/api/admin/users/${userId}/access`, {
    method: 'PUT',
    body: JSON.stringify(access),
  })

export interface AuditLogFilters {
  entityType?: string
  action?: string
}

export const fetchAuditLog = (page = 0, size = 50, filters: AuditLogFilters = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.entityType) params.set('entityType', filters.entityType)
  if (filters.action) params.set('action', filters.action)
  return getJson<Page<AuditLogEntry>>(`/api/admin/audit?${params.toString()}`)
}
