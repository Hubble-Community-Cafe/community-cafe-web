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
  /** ID of the parent tab, or null when this category IS a tab. */
  parentId: number | null
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
  /** Public URL of the item image, or null when none is set. */
  imageUrl: string | null
  sortOrder: number
  active: boolean
}

/** A sub-heading category together with its (active) items: the public-facing shape. */
export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[]
}

/** A top-level tab with its sub-heading categories and their items. */
export interface MenuTab {
  id: number
  name: string
  kind: MenuKind
  availabilityNote: string | null
  sortOrder: number
  bar: BarScope
  categories: MenuCategoryWithItems[]
}

/** Hubble's daily dinner dish, surfaced separately from the standing menu. */
export interface DailyDish {
  id: number
  date: string
  name: string
  description: string | null
  price: number | null
  /** Public URL of the dish image, or null when none is set. */
  imageUrl: string | null
}
