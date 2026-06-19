import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, PageHeader } from '../components/PageHeader'
import { CategoryForm } from './menu/CategoryForm'
import { ItemForm } from './menu/ItemForm'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
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
  }

  const toggleCat = (id: number) => {
    if (expandedCatId === id) {
      setExpandedCatId(null)
    } else {
      setExpandedCatId(id)
      loadItems(id)
    }
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
              defaultSortOrder={tabs.length + 1}
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
          <div className="space-y-2">
            {tabs.map((tab) => (
              <div key={tab.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                {/* Tab row */}
                {editingCategory?.id === tab.id ? (
                  <div className="p-4">
                    <CategoryForm
                      initial={tab}
                      defaultBar={selectedBar}
                      defaultSortOrder={tab.sortOrder}
                      onSave={handleUpdateCategory}
                      onCancel={() => setEditingCategory(null)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
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
                      </button>
                      {canEditContent && (
                        <div className="flex shrink-0 gap-1">
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
                              defaultSortOrder={subsForTab(tab.id).length + 1}
                              fixedParentId={tab.id}
                              onSave={handleCreateSub}
                              onCancel={() => setNewSubForTab(null)}
                            />
                          </div>
                        )}

                        {subsForTab(tab.id).length === 0 && newSubForTab !== tab.id && (
                          <p className="text-xs text-slate-400">No sub-categories yet.</p>
                        )}

                        {subsForTab(tab.id).map((cat) => (
                          <div key={cat.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                            {/* Sub-category row */}
                            {editingCategory?.id === cat.id ? (
                              <div className="p-4">
                                <CategoryForm
                                  initial={cat}
                                  defaultBar={selectedBar}
                                  defaultSortOrder={cat.sortOrder}
                                  fixedParentId={cat.parentId ?? undefined}
                                  onSave={handleUpdateCategory}
                                  onCancel={() => setEditingCategory(null)}
                                />
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 px-4 py-2.5">
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
                                  </button>
                                  {canEditContent && (
                                    <div className="flex shrink-0 gap-1">
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
                                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</span>
                                      {canEditContent && (
                                        <button
                                          onClick={() => { setNewItemForCategory(cat.id); setEditingItem(null) }}
                                          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                          <Plus className="h-3.5 w-3.5" /> Add item
                                        </button>
                                      )}
                                    </div>

                                    {newItemForCategory === cat.id && (
                                      <div className="mb-3 rounded-xl border border-hubble-100 bg-white p-4">
                                        <ItemForm
                                          defaultSortOrder={(itemsByCategory[cat.id]?.length ?? 0) + 1}
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
                                      <div className="space-y-1">
                                        {itemsByCategory[cat.id].map((item) => (
                                          <div key={item.id}>
                                            {editingItem?.id === item.id ? (
                                              <div className="rounded-xl border border-hubble-100 bg-white p-4">
                                                <ItemForm
                                                  initial={item}
                                                  defaultSortOrder={item.sortOrder}
                                                  onSave={handleUpdateItem}
                                                  onCancel={() => setEditingItem(null)}
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                  {!item.active && (
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">hidden</span>
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
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
