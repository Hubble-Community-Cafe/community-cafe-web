import type { BarLocation, MenuKind, DailyDish as SharedDailyDish, MenuCategory as SharedMenuCategory, MenuItem as SharedMenuItem } from '@cafe/shared-web'
import { getJson, sendNoContent, deleteResource } from './client'

// ── Menu types ─────────────────────────────────────────────────────────────────
export interface MenuCategory extends SharedMenuCategory {
  /** When false the category and everything under it is hidden from the public site. */
  active: boolean
}

export interface MenuItem extends SharedMenuItem {
  /** No picker for it yet: the form sends it back unchanged so a save keeps the image. */
  imageId: number | null
}

export interface DailyDish extends SharedDailyDish {
  /** No picker for it yet: the form sends it back unchanged so a save keeps the image. */
  imageId: number | null
}

export interface MenuCategoryRequest {
  name: string
  kind: MenuKind
  availabilityNote: string | null
  /** Omit to append on create, or to leave the position alone on update. Set by dragging. */
  sortOrder?: number | null
  bar: BarLocation | null
  parentId: number | null
  /** Omit to keep the category visible; the backend treats a missing flag as active. */
  active?: boolean
}

export interface MenuItemRequest {
  name: string
  description: string | null
  regularPrice: number
  studentPrice: number | null
  sizeOptions: string[]
  dietaryTags: string[]
  allergens: string[]
  imageId: number | null
  /** Omit to append on create, or to leave the position alone on update. Set by dragging. */
  sortOrder?: number | null
  active: boolean
}

export interface DailyDishRequest {
  date: string
  name: string
  description: string | null
  price: number | null
  imageId: number | null
}

// ── Menu endpoints ─────────────────────────────────────────────────────────────
export const fetchMenuCategories = () =>
  getJson<MenuCategory[]>('/api/admin/menu/categories')

export const createMenuCategory = (req: MenuCategoryRequest) =>
  getJson<MenuCategory>('/api/admin/menu/categories', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateMenuCategory = (id: number, req: MenuCategoryRequest) =>
  getJson<MenuCategory>(`/api/admin/menu/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteMenuCategory = (id: number) =>
  deleteResource(`/api/admin/menu/categories/${id}`, 'the category')

/**
 * Show or hide a category (and everything under it) on the public site. Separate from
 * updateMenuCategory so a quick toggle cannot overwrite fields edited elsewhere.
 */
export const setMenuCategoryActive = (id: number, active: boolean) =>
  getJson<MenuCategory>(`/api/admin/menu/categories/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })

export const fetchMenuItems = (categoryId: number) =>
  getJson<MenuItem[]>(`/api/admin/menu/categories/${categoryId}/items`)

export const createMenuItem = (categoryId: number, req: MenuItemRequest) =>
  getJson<MenuItem>(`/api/admin/menu/categories/${categoryId}/items`, {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateMenuItem = (id: number, req: MenuItemRequest) =>
  getJson<MenuItem>(`/api/admin/menu/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteMenuItem = (id: number) =>
  deleteResource(`/api/admin/menu/items/${id}`, 'the item')

/** Show or hide a single item on the public site. */
export const setMenuItemActive = (id: number, active: boolean) =>
  getJson<MenuItem>(`/api/admin/menu/items/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })

export interface BulkPriceRequest {
  ids: number[]
  /** Omit or null to leave this price as it is on each item. */
  regularPrice?: number | null
  studentPrice?: number | null
  /** A null studentPrice means "unchanged", so removing one needs its own flag. */
  clearStudentPrice?: boolean
}

/** Set the same price on several items. Returns the items as saved. */
export const bulkSetMenuItemPrice = (req: BulkPriceRequest) =>
  getJson<MenuItem[]>('/api/admin/menu/items/bulk-price', {
    method: 'PATCH',
    body: JSON.stringify(req),
  })

/** Move several items into another sub-heading, appending them after what is already there. */
export const bulkMoveMenuItems = (ids: number[], categoryId: number) =>
  getJson<MenuItem[]>('/api/admin/menu/items/bulk-move', {
    method: 'PATCH',
    body: JSON.stringify({ ids, categoryId }),
  })

/**
 * Apply a dragged order. Like the visibility toggles these are separate from the update calls,
 * so a drag only ever writes positions and cannot overwrite fields edited elsewhere. The backend
 * rejects an order that is not exactly the list it belongs to, which catches a stale tab.
 */
export const reorderMenuCategories = (
  scope: { parentId: number | null; bar: BarLocation | null },
  orderedIds: number[],
) =>
  sendNoContent('/api/admin/menu/categories/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ ...scope, orderedIds }),
  })

export const reorderMenuItems = (categoryId: number, orderedIds: number[]) =>
  sendNoContent(`/api/admin/menu/categories/${categoryId}/items/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })

export const fetchDailyDishes = () =>
  getJson<DailyDish[]>('/api/admin/daily-dish')

export const createDailyDish = (req: DailyDishRequest) =>
  getJson<DailyDish>('/api/admin/daily-dish', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateDailyDish = (id: number, req: DailyDishRequest) =>
  getJson<DailyDish>(`/api/admin/daily-dish/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteDailyDish = (id: number) =>
  deleteResource(`/api/admin/daily-dish/${id}`, 'the daily dish')
