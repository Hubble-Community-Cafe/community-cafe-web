import type { BarLocation } from './bar'

export interface CafeEvent {
  id: number
  bar: BarLocation
  title: string
  /** Event date as "YYYY-MM-DD". */
  date: string
  /** Start time as "HH:mm", or null when not set. */
  startTime: string | null
  /** Free-text price, including "TBD" or "Free". */
  price: string | null
  description: string | null
  imageId: number | null
  imageUrl: string | null
  imageAlt: string | null
  /** External sign-up/subscribe link, or null. */
  subscribeLink: string | null
  published: boolean
}
