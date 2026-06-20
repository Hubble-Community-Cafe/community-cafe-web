import type { APIRequestContext } from '@playwright/test'
import { BACKEND_URL } from '../playwright.config'

/**
 * Helpers for the backend's e2e-only /test endpoints (see TestSupportController) and for
 * seeding content through the real admin API via the X-Test-Oid header bridge. Specs start
 * from a known baseline without going through Azure-authenticated login.
 */

export type AdminRole = 'VIEWER' | 'DDD_POSTER' | 'EDITOR' | 'ADMIN'

/** The fixed identity the admin frontend authenticates as (matches docker-compose.e2e.yml). */
export const ADMIN_UI_OID = 'e2e-user'
/** A separate identity used to seed content over the API, always provisioned as ADMIN. */
export const SEEDER_OID = 'e2e-seeder'

function authHeaders(oid: string): Record<string, string> {
  return { 'X-Test-Oid': oid }
}

/** Wipe all content, media, audit, and users to a clean baseline. */
export async function resetBackend(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${BACKEND_URL}/test/reset`)
  if (res.status() === 401 || res.status() === 403) {
    throw new Error(
      `/test/reset was rejected (${res.status()}). The backend at ${BACKEND_URL} is not serving ` +
      `the e2e security chain. Ensure it runs with SPRING_PROFILES_ACTIVE=e2e (a stale image, or a ` +
      `non-e2e backend already bound to the port, is the usual cause). Try a clean rebuild: ` +
      `npm run stack:down && npm run stack:up.`,
    )
  }
  if (!res.ok()) throw new Error(`/test/reset failed: ${res.status()}`)
}

/** Create or update an admin user with a given role (for RBAC scenarios). */
export async function seedUser(
  request: APIRequestContext,
  user: { oid: string; email?: string; name?: string; role: AdminRole },
): Promise<void> {
  const res = await request.post(`${BACKEND_URL}/test/users`, { data: user })
  if (!res.ok()) throw new Error(`/test/users failed: ${res.status()}`)
}

/** Set the role of the identity the admin UI logs in as. */
export async function setUiRole(request: APIRequestContext, role: AdminRole): Promise<void> {
  await seedUser(request, { oid: ADMIN_UI_OID, email: 'e2e@community.cafe', name: 'E2E User', role })
}

/** Ensure the API seeder identity exists as ADMIN, then return its auth headers. */
async function asSeeder(request: APIRequestContext): Promise<Record<string, string>> {
  await seedUser(request, { oid: SEEDER_OID, role: 'ADMIN' })
  return authHeaders(SEEDER_OID)
}

async function adminPost<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const headers = await asSeeder(request)
  const res = await request.post(`${BACKEND_URL}${path}`, { headers, data })
  if (!res.ok()) throw new Error(`POST ${path} failed: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<T>
}

async function adminPut(request: APIRequestContext, path: string, data: unknown): Promise<void> {
  const headers = await asSeeder(request)
  const res = await request.put(`${BACKEND_URL}${path}`, { headers, data })
  if (!res.ok()) throw new Error(`PUT ${path} failed: ${res.status()} ${await res.text()}`)
}

export type Bar = 'HUBBLE' | 'METEOR'

/** Today as YYYY-MM-DD (local). */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** A date `days` in the future as YYYY-MM-DD, for "upcoming" events. */
export function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ── Content seeders (through the real admin endpoints) ─────────────────────────

export interface SeedWeeklyHours {
  open: string
  close: string
  kitchenOpen?: string | null
  kitchenClose?: string | null
}

/** Upsert standing hours for one weekday (e.g. day "MONDAY"). */
export function seedWeeklyHours(
  request: APIRequestContext, bar: Bar, day: string, hours: SeedWeeklyHours,
): Promise<void> {
  return adminPut(request, `/api/admin/opening-hours/${bar}/${day}`, {
    kitchenOpen: null, kitchenClose: null, ...hours,
  })
}

/** Seed a one-off date override (e.g. a closed day), which takes precedence over weekly hours. */
export function seedHoursOverride(
  request: APIRequestContext, bar: Bar,
  override: { date: string; closed: boolean; note?: string | null; open?: string | null; close?: string | null },
): Promise<{ id: number }> {
  return adminPost(request, `/api/admin/opening-hours/${bar}/overrides`, {
    open: null, close: null, note: null, ...override,
  })
}

export function seedMenuCategory(
  request: APIRequestContext,
  cat: { name: string; kind?: 'DRINK' | 'FOOD'; bar?: Bar | null; sortOrder?: number; parentId?: number | null },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/menu/categories', {
    kind: 'DRINK', availabilityNote: null, sortOrder: 0, bar: null, parentId: null, ...cat,
  })
}

export function seedMenuItem(
  request: APIRequestContext, categoryId: number,
  item: { name: string; regularPrice: number; studentPrice?: number | null; description?: string | null },
): Promise<{ id: number }> {
  return adminPost(request, `/api/admin/menu/categories/${categoryId}/items`, {
    description: null, studentPrice: null, sizeOptions: [], dietaryTags: [], allergens: [],
    imageId: null, sortOrder: 0, active: true, ...item,
  })
}

export function seedDailyDish(
  request: APIRequestContext,
  dish: { date: string; name: string; description?: string | null; price?: number | null },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/daily-dish', { description: null, price: null, imageId: null, ...dish })
}

export function seedEvent(
  request: APIRequestContext,
  event: { bar: Bar; title: string; date: string; startTime?: string | null; price?: string | null; description?: string | null; published?: boolean },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/events', {
    startTime: null, price: null, description: null, subscribeLink: null, imageId: null,
    published: true, ...event,
  })
}

export function seedBoardTerm(
  request: APIRequestContext,
  term: { label: string; type?: 'EXECUTIVE' | 'SUPERVISORY'; bar?: Bar | null; current?: boolean; sortOrder?: number },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/board/terms', {
    type: 'EXECUTIVE', bar: null, current: false, sortOrder: 0, groupPhotoId: null, photoCredit: null, ...term,
  })
}

export function seedBoardMember(
  request: APIRequestContext, termId: number,
  member: { name: string; role?: string | null; sortOrder?: number },
): Promise<{ id: number }> {
  return adminPost(request, `/api/admin/board/terms/${termId}/members`, {
    role: null, photoId: null, sortOrder: 0, ...member,
  })
}

export function seedVacancy(
  request: APIRequestContext,
  vacancy: { title: string; bar?: Bar | null; description?: string | null; hours?: string | null; type?: string | null; active?: boolean; sortOrder?: number },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/vacancies', {
    description: null, hours: null, type: null, applyEmail: null, applyLink: null, imageId: null,
    bar: null, active: true, sortOrder: 0, ...vacancy,
  })
}

export function seedAssociation(
  request: APIRequestContext,
  association: { name: string; bar?: Bar | null; logoId?: number | null },
): Promise<{ id: number }> {
  return adminPost(request, '/api/admin/associations', { logoId: null, bar: null, ...association })
}
