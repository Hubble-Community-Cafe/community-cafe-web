import { getJson } from './client'
import type { BarLocation } from '../types/bar'
import type { CafeEvent } from '../types/event'

/** Upcoming published events for a bar, sorted date ascending. */
export function getUpcomingEvents(bar: BarLocation): Promise<CafeEvent[]> {
  return getJson<CafeEvent[]>(`/api/events/${bar}`)
}
