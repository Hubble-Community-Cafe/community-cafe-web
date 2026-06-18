import { PublicClientApplication } from '@azure/msal-browser'
import { getE2eAuth } from './e2eAuth'
// Window.__RUNTIME_CONFIG__ type is declared in authConfig.ts.

const getApiUrl = (): string => {
  const runtimeUrl = window.__RUNTIME_CONFIG__?.API_URL
  if (runtimeUrl && !runtimeUrl.startsWith('__')) {
    return runtimeUrl
  }
  // In containers the API_URL is injected at startup; locally default to the
  // documented dev backend so the app loads without a .env.
  return import.meta.env.VITE_API_URL || 'http://localhost:8080'
}

const API_BASE_URL = getApiUrl()

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

let msalInstance: PublicClientApplication | null = null

export const setMsalInstance = (instance: PublicClientApplication) => {
  msalInstance = instance
}

export const clearAuth = () => {
  sessionStorage.clear()
}

// Azure AD returns a token for ONE resource at a time, so we request only the
// API scope here (never mixed with Graph scopes).
const getApiScope = () => {
  const clientId =
    window.__RUNTIME_CONFIG__?.AZURE_CLIENT_ID || import.meta.env.VITE_AZURE_CLIENT_ID
  return `api://${clientId}/access_as_user`
}

const getAccessToken = async (): Promise<string | null> => {
  if (!msalInstance) {
    console.error('MSAL instance not set')
    return null
  }
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return null
  }
  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: [getApiScope()],
      account: accounts[0],
    })
    return response.accessToken
  } catch (error) {
    console.error('Failed to acquire token silently:', error)
    return null
  }
}

/** Fetch against the backend with admin authentication (MSAL bearer, or e2e headers). */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }

  const e2e = getE2eAuth()
  if (e2e) {
    headers['X-Test-Oid'] = e2e.oid
    if (e2e.email) headers['X-Test-Email'] = e2e.email
    if (e2e.name) headers['X-Test-Name'] = e2e.name
  } else {
    const token = await getAccessToken()
    if (!token) {
      throw new Error('Not authenticated')
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(fullUrl, { ...options, headers })

  if (response.status === 401) {
    clearAuth()
    throw new Error('Authentication failed')
  }
  if (response.status === 403) {
    throw new ForbiddenError('You do not have permission to perform this action')
  }
  return response
}

async function getJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, options)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }
  return response.json() as Promise<T>
}

// ── Types (mirror the backend DTOs) ────────────────────────────────────────────
export type AdminRole = 'VIEWER' | 'EDITOR' | 'ADMIN'

export interface AdminUser {
  id: number
  email: string
  displayName: string | null
  role: AdminRole
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

export const updateUserRole = (userId: number, role: AdminRole) =>
  getJson<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })

export const fetchAuditLog = (page = 0, size = 50) =>
  getJson<Page<AuditLogEntry>>(`/api/admin/audit?page=${page}&size=${size}`)

// ── Menu types ─────────────────────────────────────────────────────────────────
export type MenuKind = 'DRINK' | 'FOOD'
export type BarLocation = 'HUBBLE' | 'METEOR'

export interface MenuCategory {
  id: number
  name: string
  kind: MenuKind
  availabilityNote: string | null
  sortOrder: number
  bar: BarLocation | null
  /** null when this category is a top-level tab; set when it is a sub-heading within a tab. */
  parentId: number | null
}

export interface MenuItem {
  id: number
  categoryId: number
  name: string
  description: string | null
  regularPrice: number
  studentPrice: number | null
  sizeOptions: string[]
  dietaryTags: string[]
  allergens: string[]
  imageUrl: string | null
  sortOrder: number
  active: boolean
}

export interface DailyDish {
  id: number
  date: string
  name: string
  description: string | null
  price: number | null
  imageUrl: string | null
}

export interface MenuCategoryRequest {
  name: string
  kind: MenuKind
  availabilityNote: string | null
  sortOrder: number
  bar: BarLocation | null
  parentId: number | null
}

export interface MenuItemRequest {
  name: string
  description: string | null
  regularPrice: number
  studentPrice: number | null
  sizeOptions: string[]
  dietaryTags: string[]
  allergens: string[]
  imageId: number | null
  sortOrder: number
  active: boolean
}

export interface DailyDishRequest {
  date: string
  name: string
  description: string | null
  price: number | null
  imageId: number | null
}

// ── Menu endpoints ─────────────────────────────────────────────────────────────
export const fetchMenuCategories = () =>
  getJson<MenuCategory[]>('/api/admin/menu/categories')

export const createMenuCategory = (req: MenuCategoryRequest) =>
  getJson<MenuCategory>('/api/admin/menu/categories', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateMenuCategory = (id: number, req: MenuCategoryRequest) =>
  getJson<MenuCategory>(`/api/admin/menu/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteMenuCategory = (id: number) =>
  fetchWithAuth(`/api/admin/menu/categories/${id}`, { method: 'DELETE' })

export const fetchMenuItems = (categoryId: number) =>
  getJson<MenuItem[]>(`/api/admin/menu/categories/${categoryId}/items`)

export const createMenuItem = (categoryId: number, req: MenuItemRequest) =>
  getJson<MenuItem>(`/api/admin/menu/categories/${categoryId}/items`, {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateMenuItem = (id: number, req: MenuItemRequest) =>
  getJson<MenuItem>(`/api/admin/menu/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteMenuItem = (id: number) =>
  fetchWithAuth(`/api/admin/menu/items/${id}`, { method: 'DELETE' })

export const fetchDailyDishes = () =>
  getJson<DailyDish[]>('/api/admin/menu/daily-dish')

export const createDailyDish = (req: DailyDishRequest) =>
  getJson<DailyDish>('/api/admin/menu/daily-dish', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateDailyDish = (id: number, req: DailyDishRequest) =>
  getJson<DailyDish>(`/api/admin/menu/daily-dish/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteDailyDish = (id: number) =>
  fetchWithAuth(`/api/admin/menu/daily-dish/${id}`, { method: 'DELETE' })

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface WeeklyHours {
  id: number
  bar: BarLocation
  dayOfWeek: DayOfWeek
  open: string
  close: string
  kitchenOpen: string | null
  kitchenClose: string | null
}

export interface WeeklyHoursRequest {
  open: string
  close: string
  kitchenOpen: string | null
  kitchenClose: string | null
}

export interface HoursOverride {
  id: number
  bar: BarLocation
  date: string
  closed: boolean
  open: string | null
  close: string | null
  note: string | null
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
  fetchWithAuth(`/api/admin/opening-hours/${bar}/${day}`, { method: 'DELETE' })

export const fetchOverrides = (bar: BarLocation) =>
  getJson<HoursOverride[]>(`/api/admin/opening-hours/${bar}/overrides`)

export const createOverride = (bar: BarLocation, req: HoursOverrideRequest) =>
  getJson<HoursOverride>(`/api/admin/opening-hours/${bar}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

export const deleteOverride = (id: number) =>
  fetchWithAuth(`/api/admin/opening-hours/overrides/${id}`, { method: 'DELETE' })

// ── Event types ─────────────────────────────────────────────────────────────────
export interface CafeEvent {
  id: number
  bar: BarLocation
  title: string
  date: string
  startTime: string | null
  price: string | null
  description: string | null
  imageId: number | null
  imageUrl: string | null
  imageAlt: string | null
  subscribeLink: string | null
  published: boolean
}

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
