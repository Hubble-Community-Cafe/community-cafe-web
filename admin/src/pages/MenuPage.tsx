import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, PageHeader } from '../components/PageHeader'
import { SortableList } from '../components/SortableList'
import { BulkActionBar } from './menu/BulkActionBar'
import { VisibilityToggle } from '../components/VisibilityToggle'
import { CategoryForm } from './menu/CategoryForm'
import { ItemForm } from './menu/ItemForm'
import { usePermissions } from '../lib/usePermissions'
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
} from '../lib/api'

const BARS: { id: BarLocation; label: string }[] = [
  { id: 'HUBBLE', label: 'Hubble' },
  { id: 'METEOR', label: 'Meteor' },
]

function kindBadge(kind: 'DRINK' | 'FOOD') {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        kind === 'DRINK' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {kind === 'DRINK' ? 'Drink' : 'Food'}
    </span>
  )
}

export function MenuPage() {
  const { canEditContent } = usePermissions()
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

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category and all its items?')) return
    await deleteMenuCategory(id)
    setAllCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id))
    setItemsByCategory((prev) => { const n = { ...prev }; delete n[id]; return n })
    if (expandedTabId === id) setExpandedTabId(null)
    if (expandedCatId === id) setExpandedCatId(null)
  }

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

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm('Delete this item?')) return
    await deleteMenuItem(item.id)
    setItemsByCategory((prev) => ({
      ...prev,
      [item.categoryId]: (prev[item.categoryId] ?? []).filter((i) => i.id !== item.id),
    }))
  }

  return (
    <>
      <PageHeader title="Menu" description="Manage menu tabs, categories, and items for both cafes." />

      {/* Bar selector */}
      <div className="mb-6 flex gap-2">
        {BARS.map((b) => (
          <button
            key={b.id}
            onClick={() => { setSelectedBar(b.id); setExpandedTabId(null); setExpandedCatId(null) }}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              selectedBar === b.id
                ? 'bg-hubble-700 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <Card>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-title text-lg font-semibold text-slate-800">Tabs</h2>
          {canEditContent && (
            <button
              onClick={() => { setShowNewTab(true); setEditingCategory(null) }}
              className="flex items-center gap-1.5 rounded-lg bg-hubble-700 px-3 py-2 text-sm font-semibold text-white hover:bg-hubble-800"
            >
              <Plus className="h-4 w-4" /> Add tab
            </button>
          )}
        </div>

        {showNewTab && (
          <div className="mb-4 rounded-xl border border-hubble-100 bg-hubble-50 p-4">
            <CategoryForm
              defaultBar={selectedBar}
              onSave={handleCreateTab}
              onCancel={() => setShowNewTab(false)}
            />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : tabs.length === 0 && !showNewTab ? (
          <p className="text-sm text-slate-500">No tabs yet for this bar.</p>
        ) : (
          <SortableList
            items={tabs}
            getId={(t) => t.id}
            labelFor={(t) => t.name}
            disabled={!canEditContent}
            // An expanded tab is a whole panel tall, so collapse it to move it. Its siblings
            // can still be dragged around it.
            draggable={(t) => expandedTabId !== t.id}
            onReorder={(next) => handleReorderCategories({ parentId: null, bar: selectedBar }, next)}
            className="space-y-2"
          >
            {(tab, tabHandle) => (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                {/* Tab row */}
                {editingCategory?.id === tab.id ? (
                  <div className="p-4">
                    <CategoryForm
                      initial={tab}
                      defaultBar={selectedBar}
                      onSave={handleUpdateCategory}
                      onCancel={() => setEditingCategory(null)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      {tabHandle}
                      <button
                        onClick={() => toggleTab(tab.id)}
                        className="flex flex-1 items-center gap-3 text-left"
                        aria-expanded={expandedTabId === tab.id}
                      >
                        {expandedTabId === tab.id
                          ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                          : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                        <span className="font-semibold text-slate-800">{tab.name}</span>
                        {kindBadge(tab.kind)}
                        {tab.availabilityNote && (
                          <span className="text-xs text-slate-400">{tab.availabilityNote}</span>
                        )}
                        {tab.bar === null && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">both bars</span>
                        )}
                        {!tab.active && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            hidden
                          </span>
                        )}
                      </button>
                      {canEditContent && (
                        <div className="flex shrink-0 gap-1">
                          <VisibilityToggle
                            active={tab.active}
                            label={tab.name}
                            onToggle={(next) => handleSetCategoryActive(tab.id, next)}
                          />
                          <button
                            onClick={() => { setEditingCategory(tab); setShowNewTab(false) }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Edit tab"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(tab.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete tab"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sub-categories */}
                    {expandedTabId === tab.id && (
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Sub-categories
                          </span>
                          {canEditContent && (
                            <button
                              onClick={() => { setNewSubForTab(tab.id); setEditingCategory(null) }}
                              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add sub-category
                            </button>
                          )}
                        </div>

                        {newSubForTab === tab.id && (
                          <div className="rounded-xl border border-hubble-100 bg-white p-4">
                            <CategoryForm
                              defaultBar={tab.bar ?? selectedBar}
                              fixedParentId={tab.id}
                              onSave={handleCreateSub}
                              onCancel={() => setNewSubForTab(null)}
                            />
                          </div>
                        )}

                        {subsForTab(tab.id).length === 0 && newSubForTab !== tab.id && (
                          <p className="text-xs text-slate-400">No sub-categories yet.</p>
                        )}

                        <SortableList
                          items={subsForTab(tab.id)}
                          getId={(c) => c.id}
                          labelFor={(c) => c.name}
                          disabled={!canEditContent}
                          draggable={(c) => expandedCatId !== c.id}
                          onReorder={(next) =>
                            handleReorderCategories({ parentId: tab.id, bar: null }, next)}
                          className="space-y-2"
                        >
                        {(cat, catHandle) => (
                          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                            {/* Sub-category row */}
                            {editingCategory?.id === cat.id ? (
                              <div className="p-4">
                                <CategoryForm
                                  initial={cat}
                                  defaultBar={selectedBar}
                                  fixedParentId={cat.parentId ?? undefined}
                                  onSave={handleUpdateCategory}
                                  onCancel={() => setEditingCategory(null)}
                                />
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 px-4 py-2.5">
                                  {catHandle}
                                  <button
                                    onClick={() => toggleCat(cat.id)}
                                    className="flex flex-1 items-center gap-3 text-left"
                                    aria-expanded={expandedCatId === cat.id}
                                  >
                                    {expandedCatId === cat.id
                                      ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                      : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                    {cat.availabilityNote && (
                                      <span className="text-xs text-slate-400">{cat.availabilityNote}</span>
                                    )}
                                    {!cat.active && (
                                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                        hidden
                                      </span>
                                    )}
                                  </button>
                                  {canEditContent && (
                                    <div className="flex shrink-0 gap-1">
                                      <VisibilityToggle
                                        active={cat.active}
                                        label={cat.name}
                                        onToggle={(next) => handleSetCategoryActive(cat.id, next)}
                                      />
                                      <button
                                        onClick={() => { setEditingCategory(cat); setNewSubForTab(null) }}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Edit sub-category"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        aria-label="Delete sub-category"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Items */}
                                {expandedCatId === cat.id && (
                                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                                    <div className="mb-2 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {canEditContent && (itemsByCategory[cat.id]?.length ?? 0) > 0 && (
                                          <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={allSelected(cat.id)}
                                              ref={(el) => {
                                                // Some but not all: the box shows the in-between state
                                                // rather than pretending the whole list is picked.
                                                if (el) el.indeterminate = someSelected(cat.id) && !allSelected(cat.id)
                                              }}
                                              onChange={() => toggleSelectAll(cat.id)}
                                              aria-label={`Select all items in ${cat.name}`}
                                              className="h-4 w-4 rounded border-slate-300"
                                            />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</span>
                                          </label>
                                        )}
                                        {!(canEditContent && (itemsByCategory[cat.id]?.length ?? 0) > 0) && (
                                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</span>
                                        )}
                                      </div>
                                      {canEditContent && (
                                        <button
                                          onClick={() => { setNewItemForCategory(cat.id); setEditingItem(null) }}
                                          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                          <Plus className="h-3.5 w-3.5" /> Add item
                                        </button>
                                      )}
                                    </div>

                                    {canEditContent && selectedItemIds.size > 0 && (
                                      <BulkActionBar
                                        selected={(itemsByCategory[cat.id] ?? []).filter((i) => selectedItemIds.has(i.id))}
                                        moveTargets={moveTargetsExcluding(cat.id)}
                                        onSetPrice={(req) => handleBulkPrice(cat.id, req)}
                                        onMove={(targetId) => handleBulkMove(cat.id, targetId)}
                                        onClear={() => setSelectedItemIds(new Set())}
                                      />
                                    )}

                                    {newItemForCategory === cat.id && (
                                      <div className="mb-3 rounded-xl border border-hubble-100 bg-white p-4">
                                        <ItemForm
                                          onSave={(req) => handleCreateItem(cat.id, req)}
                                          onCancel={() => setNewItemForCategory(null)}
                                        />
                                      </div>
                                    )}

                                    {!itemsByCategory[cat.id] ? (
                                      <p className="text-xs text-slate-400">Loading items…</p>
                                    ) : itemsByCategory[cat.id].length === 0 && newItemForCategory !== cat.id ? (
                                      <p className="text-xs text-slate-400">No items yet.</p>
                                    ) : (
                                      <SortableList
                                        items={itemsByCategory[cat.id]}
                                        getId={(i) => i.id}
                                        labelFor={(i) => i.name}
                                        // Dragging is off while a selection is active: the two
                                        // gestures compete for the same rows, and picking items is
                                        // the one you are in the middle of.
                                        disabled={!canEditContent || selectedItemIds.size > 0}
                                        draggable={(i) => editingItem?.id !== i.id}
                                        onReorder={(next) => handleReorderItems(cat.id, next)}
                                        className="space-y-1"
                                      >
                                        {(item, itemHandle) => (
                                          <div>
                                            {editingItem?.id === item.id ? (
                                              <div className="rounded-xl border border-hubble-100 bg-white p-4">
                                                <ItemForm
                                                  initial={item}
                                                  onSave={handleUpdateItem}
                                                  onCancel={() => setEditingItem(null)}
                                                />
                                              </div>
                                            ) : (
                                              <div className={`flex items-center justify-between rounded-lg border bg-white px-3 py-2 ${
                                                selectedItemIds.has(item.id)
                                                  ? 'border-hubble-300 ring-1 ring-hubble-200'
                                                  : 'border-slate-200'
                                              }`}>
                                                <div className="flex items-center gap-3">
                                                  {canEditContent && (
                                                    <input
                                                      type="checkbox"
                                                      checked={selectedItemIds.has(item.id)}
                                                      onChange={() => toggleItemSelected(item.id)}
                                                      aria-label={`Select ${item.name}`}
                                                      className="h-4 w-4 shrink-0 rounded border-slate-300"
                                                    />
                                                  )}
                                                  {itemHandle}
                                                  {!item.active && (
                                                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">hidden</span>
                                                  )}
                                                  <span className="text-sm text-slate-800">{item.name}</span>
                                                  <span className="text-sm text-slate-500">
                                                    €{item.regularPrice.toFixed(2)}
                                                    {item.studentPrice != null && <> / €{item.studentPrice.toFixed(2)}</>}
                                                  </span>
                                                  {item.description && (
                                                    <span className="hidden text-xs text-slate-400 sm:block">{item.description}</span>
                                                  )}
                                                </div>
                                                {canEditContent && (
                                                  <div className="flex gap-1">
                                                    <VisibilityToggle
                                                      active={item.active}
                                                      label={item.name}
                                                      onToggle={(next) => handleSetItemActive(cat.id, item.id, next)}
                                                    />
                                                    <button
                                                      onClick={() => { setEditingItem(item); setNewItemForCategory(null) }}
                                                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                      aria-label="Edit item"
                                                    >
                                                      <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteItem(item)}
                                                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                      aria-label="Delete item"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </SortableList>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        </SortableList>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </SortableList>
        )}
      </Card>
    </>
  )
}
