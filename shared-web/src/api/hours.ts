import { getJson } from './client'
import type { BarLocation } from '../types/bar'
import type { WeeklyHours, BarStatus, HoursOverride } from '../types/hours'

/** Weekly schedule for a bar, ordered Monday to Sunday. Days not present are closed. */
export function getWeeklyHours(bar: BarLocation): Promise<WeeklyHours[]> {
  return getJson<WeeklyHours[]>(`/api/opening-hours/${bar}`)
}

/** Today's open/closed status, accounting for any date override. */
export function getBarStatus(bar: BarLocation): Promise<BarStatus> {
  return getJson<BarStatus>(`/api/opening-hours/${bar}/status`)
}

/** Upcoming date overrides (today and future) for a bar. */
export function getUpcomingOverrides(bar: BarLocation): Promise<HoursOverride[]> {
  return getJson<HoursOverride[]>(`/api/opening-hours/${bar}/overrides`)
}
