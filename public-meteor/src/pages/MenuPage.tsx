import { useEffect, useState } from 'react'
import { getMenu, type MenuTab, type MenuCategoryWithItems, type MenuItem } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'

function formatPrice(regular: number, student: number | null): string {
  const fmt = (n: number) => `€${n.toFixed(2).replace('.', ',')}`
  return student != null ? `${fmt(regular)}/${fmt(student)}` : fmt(regular)
}

function MenuItemRow({ item }: { item: MenuItem }) {
  const tags = [...item.dietaryTags, ...item.allergens].filter(Boolean)
  return (
    <div className="py-1.5">
      <div className="flex items-baseline">
        <span className="text-sm font-bold uppercase tracking-wide text-meteor-900">
          {item.name}
        </span>
        <span className="mx-2 flex-1 border-b border-meteor-700/40 self-center" />
        <span className="shrink-0 text-sm font-semibold text-meteor-800">
          {formatPrice(item.regularPrice, item.studentPrice)}
        </span>
      </div>
      {item.description && (
        <p className="mt-0.5 text-xs uppercase tracking-wide text-meteor-700/70">
          {item.description}
        </p>
      )}
      {tags.length > 0 && (
        <p className="mt-0.5 text-xs uppercase tracking-wide text-meteor-700/50">{tags.join(', ')}</p>
      )}
    </div>
  )
}

function CategoryBlock({ category }: { category: MenuCategoryWithItems }) {
  return (
    <div>
      <h3 className="mb-3 font-title text-2xl font-black uppercase text-meteor-900">
        {category.name}
      </h3>
      {category.availabilityNote && (
        <p className="mb-2 text-xs uppercase tracking-wide text-meteor-700/70">
          {category.availabilityNote}
        </p>
      )}
      <div>
        {category.items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
        {category.items.length === 0 && (
          <p className="py-2 text-sm text-meteor-700/50">No items yet.</p>
        )}
      </div>
    </div>
  )
}

export function MenuPage() {
  const [tabs, setTabs] = useState<MenuTab[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getMenu('METEOR')
      .then((data) => {
        setTabs(data)
        if (data.length > 0) setActiveTabId(data[0].id)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <PageShell title="Menu">
      {/* Student discount info */}
      <p className="mt-2 text-sm text-meteor-800">
        TU/e students get a discount when showing their student card.
      </p>
      <p className="mt-1 text-sm text-meteor-800/70">Regular price / TU/e student price</p>

      {isLoading && <p className="mt-8 text-sm text-meteor-700/60">Loading menu…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">Could not load the menu. Please try again later.</p>
      )}

      {!isLoading && !error && tabs.length > 0 && (
        <>
          {/* Tab navigation */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`rounded-sm border-2 border-meteor-900 px-5 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                  tab.id === activeTabId
                    ? 'bg-meteor-900 text-white'
                    : 'bg-white text-meteor-900 hover:bg-meteor-900 hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {activeTab && (
            <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {activeTab.categories.map((cat) => (
                <CategoryBlock key={cat.id} category={cat} />
              ))}
              {activeTab.categories.length === 0 && (
                <p className="text-sm text-meteor-700/60">No items in this section yet.</p>
              )}
            </div>
          )}
        </>
      )}

      {!isLoading && !error && tabs.length === 0 && (
        <p className="mt-8 text-sm text-meteor-700/60">
          The menu is being updated. Check back soon.
        </p>
      )}
    </PageShell>
  )
}
