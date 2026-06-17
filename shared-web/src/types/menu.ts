import type { BarScope } from './bar'

export type MenuKind = 'DRINK' | 'FOOD'

export interface MenuCategory {
  id: number
  name: string
  kind: MenuKind
  /** Free-text note such as "available after 17:00". */
  availabilityNote: string | null
  sortOrder: number
  bar: BarScope
}

export interface MenuItem {
  id: number
  categoryId: number
  name: string
  description: string | null
  /** Regular price in euros. */
  regularPrice: number
  /** TU/e student price in euros for dual pricing, or null when not applicable. */
  studentPrice: number | null
  /** Size options such as "0.25L" / "0.5L". */
  sizeOptions: string[]
  dietaryTags: string[]
  allergens: string[]
  imageId: number | null
  sortOrder: number
  active: boolean
}

/** Hubble's daily dinner dish, surfaced separately from the standing menu. */
export interface DailyDish {
  id: number
  date: string
  name: string
  description: string | null
  price: number | null
  imageId: number | null
}
