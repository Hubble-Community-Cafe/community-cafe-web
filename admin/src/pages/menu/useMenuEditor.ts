import { useCallback, useEffect, useState } from 'react'
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  setMenuCategoryActive,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuItemActive,
  reorderMenuCategories,
  reorderMenuItems,
  bulkSetMenuItemPrice,
  bulkMoveMenuItems,
  type BarLocation,
  type MenuCategory,
  type MenuCategoryRequest,
  type MenuItem,
  type MenuItemRequest,
} from '../../lib/api'
import { useConfirmAction } from '../../lib/confirmAction'

/**
 * Everything the Menu page knows and does: the selected bar, the category tree, loaded items,
 * what is expanded, edited or selected, and every save. Kept apart from the page so the page
 * file is only layout. Saves that feel instant (visibility, drag order) are optimistic and roll
 * back on failure; see the comments on each handler.
 */
export function useMenuEditor() {
  const confirmAction = useConfirmAction()
  const [selectedBar, setSelectedBar] = useState<BarLocation>('HUBBLE')
  const [allCategories, setAllCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedTabId, setExpandedTabId] = useState<number | null>(null)
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null)
  const [itemsByCategory, setItemsByCategory] = useState<Record<number, MenuItem[]>>({})

  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [showNewTab, setShowNewTab] = useState(false)
  const [newSubForTab, setNewSubForTab] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItemForCategory, setNewItemForCategory] = useState<number | null>(null)
  // Only one sub-category is open at a time, so a single set is enough to scope the selection.
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    try {
      setAllCategories(await fetchMenuCategories())
      setError(null)
    } catch {
      setError('Failed to load categories.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = allCategories
    .filter((c) => c.parentId === null && (c.bar === selectedBar || c.bar === null))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const subsForTab = (tabId: number) =>
    allCategories
      .filter((c) => c.parentId === tabId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const loadItems = async (categoryId: number) => {
    if (itemsByCategory[categoryId]) return
    try {
      const items = await fetchMenuItems(categoryId)
      setItemsByCategory((prev) => ({ ...prev, [categoryId]: items }))
    } catch {
      setError('Failed to load items.')
    }
  }

  const toggleTab = (id: number) => {
    setExpandedTabId(expandedTabId === id ? null : id)
    setExpandedCatId(null)
    setSelectedItemIds(new Set())
  }

  const toggleCat = (id: number) => {
    setSelectedItemIds(new Set())
    if (expandedCatId === id) {
      setExpandedCatId(null)
    } else {
      setExpandedCatId(id)
      loadItems(id)
    }
  }

  const toggleItemSelected = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = (categoryId: number) => {
    const items = itemsByCategory[categoryId] ?? []
    return items.length > 0 && items.every((i) => selectedItemIds.has(i.id))
  }

  const someSelected = (categoryId: number) =>
    (itemsByCategory[categoryId] ?? []).some((i) => selectedItemIds.has(i.id))

  const toggleSelectAll = (categoryId: number) => {
    const items = itemsByCategory[categoryId] ?? []
    setSelectedItemIds(allSelected(categoryId) ? new Set() : new Set(items.map((i) => i.id)))
  }

  /** Every other sub-category of this bar, grouped by its tab, as move destinations. */
  const moveTargetsExcluding = (categoryId: number) =>
    tabs
      .map((tab) => ({
        tabName: tab.name,
        categories: subsForTab(tab.id).filter((c) => c.id !== categoryId),
      }))
      .filter((group) => group.categories.length > 0)

  /**
   * Bulk edits are not applied optimistically: unlike a drag or a toggle there is no obvious
   * previous state to snap back to per row, and a wrong price shown as saved is worse than a
   * short wait. The bar keeps its panel open and reports the failure if the call throws.
   */
  const handleBulkPrice = async (
    categoryId: number,
    req: { regularPrice: number | null; studentPrice: number | null; clearStudentPrice: boolean },
  ) => {
    const saved = await bulkSetMenuItemPrice({ ids: [...selectedItemIds], ...req })
    const byId = new Map(saved.map((i) => [i.id, i]))
    setItemsByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? []).map((i) => byId.get(i.id) ?? i),
    }))
    setSelectedItemIds(new Set())
    setError(null)
  }

  const handleBulkMove = async (fromCategoryId: number, targetId: number) => {
    const ids = [...selectedItemIds]
    await bulkMoveMenuItems(ids, targetId)
    setItemsByCategory((prev) => {
      const next = { ...prev }
      next[fromCategoryId] = (prev[fromCategoryId] ?? []).filter((i) => !ids.includes(i.id))
      // The move renumbers the target's existing items too, so drop any cached copy of it
      // rather than trying to reproduce the new positions here.
      delete next[targetId]
      return next
    })
    setSelectedItemIds(new Set())
    setError(null)
  }

  const handleCreateTab = async (req: MenuCategoryRequest) => {
    const cat = await createMenuCategory(req)
    setAllCategories((prev) => [...prev, cat].sort((a, b) => a.sortOrder - b.sortOrder))
    setShowNewTab(false)
  }

  const handleCreateSub = async (req: MenuCategoryRequest) => {
    const cat = await createMenuCategory(req)
    setAllCategories((prev) => [...prev, cat].sort((a, b) => a.sortOrder - b.sortOrder))
    setNewSubForTab(null)
  }

  const handleUpdateCategory = async (req: MenuCategoryRequest) => {
    if (!editingCategory) return
    const cat = await updateMenuCategory(editingCategory.id, req)
    setAllCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)))
    setEditingCategory(null)
  }

  /**
   * Show/hide a tab or sub-heading. Applied optimistically and rolled back on failure so the
   * switch feels instant; naming avoids the existing toggleTab/toggleCat, which are expand state.
   */
  const handleSetCategoryActive = async (id: number, active: boolean) => {
    setAllCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)))
    try {
      const saved = await setMenuCategoryActive(id, active)
      setAllCategories((prev) => prev.map((c) => (c.id === id ? saved : c)))
    } catch {
      setAllCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !active } : c)))
      setError('Could not change visibility. Please try again.')
    }
  }

  const handleSetItemActive = async (categoryId: number, id: number, active: boolean) => {
    const patch = (value: boolean) =>
      setItemsByCategory((prev) => ({
        ...prev,
        [categoryId]: (prev[categoryId] ?? []).map((i) => (i.id === id ? { ...i, active: value } : i)),
      }))
    patch(active)
    try {
      await setMenuItemActive(id, active)
    } catch {
      patch(!active)
      setError('Could not change visibility. Please try again.')
    }
  }

  /**
   * Save a dragged order. Applied optimistically and rolled back on failure, like the visibility
   * toggles, so the list settles where it was dropped instead of waiting on the round trip. The
   * positions are renumbered locally too, otherwise a later insert would sort against stale ones.
   */
  const handleReorderCategories = async (
    scope: { parentId: number | null; bar: BarLocation | null },
    next: MenuCategory[],
  ) => {
    const previous = allCategories
    const positions = new Map(next.map((c, i) => [c.id, i]))
    setAllCategories((prev) =>
      prev.map((c) => (positions.has(c.id) ? { ...c, sortOrder: positions.get(c.id)! } : c)),
    )
    try {
      await reorderMenuCategories(scope, next.map((c) => c.id))
      setError(null)
    } catch {
      setAllCategories(previous)
      setError('Could not save the new order. Please try again.')
    }
  }

  const handleReorderItems = async (categoryId: number, next: MenuItem[]) => {
    const previous = itemsByCategory[categoryId] ?? []
    setItemsByCategory((prev) => ({
      ...prev,
      [categoryId]: next.map((item, i) => ({ ...item, sortOrder: i })),
    }))
    try {
      await reorderMenuItems(categoryId, next.map((i) => i.id))
      setError(null)
    } catch {
      setItemsByCategory((prev) => ({ ...prev, [categoryId]: previous }))
      setError('Could not save the new order. Please try again.')
    }
  }

  const handleDeleteCategory = (id: number) => confirmAction({
    title: 'Delete this category?',
    message: `"${allCategories.find((c) => c.id === id)?.name ?? 'This category'}" and everything in it will be removed from the menu.`,
    confirmLabel: 'Delete category',
    action: async () => {
      await deleteMenuCategory(id)
      setAllCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id))
      setItemsByCategory((prev) => { const n = { ...prev }; delete n[id]; return n })
      if (expandedTabId === id) setExpandedTabId(null)
      if (expandedCatId === id) setExpandedCatId(null)
    },
  })

  const handleCreateItem = async (categoryId: number, req: MenuItemRequest) => {
    const item = await createMenuItem(categoryId, req)
    setItemsByCategory((prev) => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] ?? []), item].sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    setNewItemForCategory(null)
  }

  const handleUpdateItem = async (req: MenuItemRequest) => {
    if (!editingItem) return
    const item = await updateMenuItem(editingItem.id, req)
    setItemsByCategory((prev) => ({
      ...prev,
      [item.categoryId]: (prev[item.categoryId] ?? []).map((i) => (i.id === item.id ? item : i)),
    }))
    setEditingItem(null)
  }

  const handleDeleteItem = (item: MenuItem) => confirmAction({
    title: 'Delete this item?',
    message: `"${item.name}" will be removed from the menu.`,
    confirmLabel: 'Delete item',
    action: async () => {
      await deleteMenuItem(item.id)
      setItemsByCategory((prev) => ({
        ...prev,
        [item.categoryId]: (prev[item.categoryId] ?? []).filter((i) => i.id !== item.id),
      }))
    },
  })

  return {
    selectedBar,
    setSelectedBar,
    isLoading,
    error,
    expandedTabId,
    setExpandedTabId,
    expandedCatId,
    setExpandedCatId,
    itemsByCategory,
    editingCategory,
    setEditingCategory,
    showNewTab,
    setShowNewTab,
    newSubForTab,
    setNewSubForTab,
    editingItem,
    setEditingItem,
    newItemForCategory,
    setNewItemForCategory,
    selectedItemIds,
    setSelectedItemIds,
    tabs,
    subsForTab,
    toggleTab,
    toggleCat,
    toggleItemSelected,
    allSelected,
    someSelected,
    toggleSelectAll,
    moveTargetsExcluding,
    handleBulkPrice,
    handleBulkMove,
    handleCreateTab,
    handleCreateSub,
    handleUpdateCategory,
    handleSetCategoryActive,
    handleSetItemActive,
    handleReorderCategories,
    handleReorderItems,
    handleDeleteCategory,
    handleCreateItem,
    handleUpdateItem,
    handleDeleteItem,
  }
}
