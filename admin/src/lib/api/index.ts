// The admin API client, one module per area. Import from 'lib/api' (this barrel), not from the
// modules: tests mock this path as a whole.
export { ForbiddenError, setMsalInstance, clearAuth, fetchWithAuth } from './client'
// ── Shared content types ─────────────────────────────────────────────────────────
// The API shapes the public sites read too come from shared-web; the admin only adds the fields
// its own endpoints return on top (ids of attached images, hidden-from-public flags).
export type {
  BarLocation, DayOfWeek, MenuKind, WeeklyHours, HoursOverride, CafeEvent, BoardType,
  BoardMember, Association,
} from '@cafe/shared-web'
export * from './users'
export * from './menu'
export * from './hours'
export * from './events'
export * from './board'
export * from './vacancies'
export * from './associations'
export * from './media'
export * from './screens'
