import { getJson } from './client'
import type { BarLocation } from '../types/bar'
import type { DailyDish, MenuTab } from '../types/menu'

/** Fetch the full menu for a given bar as tabs, each containing sub-categories and items. */
export function getMenu(bar: BarLocation): Promise<MenuTab[]> {
  return getJson<MenuTab[]>(`/api/menu/${bar}`)
}

/** Fetch today's daily dinner dishes (empty array when none are set for today). */
export function getTodaysDishes(): Promise<DailyDish[]> {
  return getJson<DailyDish[]>(`/api/daily-dish/today`)
}
