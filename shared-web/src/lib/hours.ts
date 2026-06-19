import type { WeeklyHours } from '../types/hours'

/** English day names, keyed by the DayOfWeek enum value. */
export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
}

/** Days in week order, used for sorting and collapsing consecutive runs. */
export const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

/** A collapsed run of consecutive days that share the same hours. */
export interface HoursGroup {
  label: string
  open: string
  close: string
}

/** Collapse consecutive days into runs that satisfy `sameGroup`. */
function collapse<T extends { dayOfWeek: string }>(
  items: T[],
  sameGroup: (a: T, b: T) => boolean,
): T[][] {
  const sorted = [...items].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
  const groups: T[][] = []
  for (const item of sorted) {
    const last = groups[groups.length - 1]
    if (last && sameGroup(last[0], item) &&
        DAY_ORDER.indexOf(item.dayOfWeek) === DAY_ORDER.indexOf(last[last.length - 1].dayOfWeek) + 1) {
      last.push(item)
    } else {
      groups.push([item])
    }
  }
  return groups
}

function rangeLabel(g: { dayOfWeek: string }[]): string {
  return g.length === 1
    ? DAY_LABELS[g[0].dayOfWeek]
    : `${DAY_LABELS[g[0].dayOfWeek]} – ${DAY_LABELS[g[g.length - 1].dayOfWeek]}`
}

/** Group standing weekly hours into consecutive-day runs (e.g. "Monday – Friday"). */
export function groupWeeklyHours(hours: WeeklyHours[]): HoursGroup[] {
  return collapse(hours, (a, b) => a.open === b.open && a.close === b.close).map((g) => ({
    label: rangeLabel(g),
    open: g[0].open,
    close: g[0].close,
  }))
}

/** Group the kitchen sub-hours of the days that have them. */
export function groupKitchenHours(hours: WeeklyHours[]): HoursGroup[] {
  const withKitchen = hours.filter((h) => h.kitchenOpen || h.kitchenClose)
  return collapse(withKitchen, (a, b) => a.kitchenOpen === b.kitchenOpen && a.kitchenClose === b.kitchenClose)
    .map((g) => ({
      label: `Kitchen (${rangeLabel(g)})`,
      open: g[0].kitchenOpen ?? '–',
      close: g[0].kitchenClose ?? '–',
    }))
}
