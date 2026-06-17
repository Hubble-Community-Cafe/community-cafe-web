import type { BarLocation, DayOfWeek } from './bar'

/** A standing weekly time slot for a bar. Times are "HH:mm" (24h), local. */
export interface WeeklyHours {
  id: number
  bar: BarLocation
  dayOfWeek: DayOfWeek
  open: string
  close: string
  kitchenOpen: string | null
  kitchenClose: string | null
}

/** A one-off override for a specific date (holiday, special closure, etc.). */
export interface HoursOverride {
  id: number
  bar: BarLocation
  date: string
  closed: boolean
  open: string | null
  close: string | null
  note: string | null
}

/** Live open/closed status, drives Meteor's closed banner. */
export interface BarStatus {
  bar: BarLocation
  isOpen: boolean
  bannerMessage: string | null
}
