import { useEffect, useState } from 'react'
import {
  getMenu,
  reportApiFailure,
  type MenuTab,
  type MenuCategoryWithItems,
  type MenuItem,
} from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { Shimmer } from '../components/Shimmer'
import { usePageSeo } from '../lib/seo'

function formatPrice(regular: number, student: number | null): string {
  const fmt = (n: number) => `€${n.toFixed(2).replace('.', ',')}`
  return student != null ? `${fmt(regular)}/${fmt(student)}` : fmt(regular)
}

/** Left-bar widths cycle so the skeleton does not look uniform. */
const SKELETON_WIDTHS = ['58%', '42%', '66%', '38%', '52%']

function MenuSkeleton() {
  return (
    <div className="mt-8 max-w-md" data-testid="menu-skeleton">
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className="flex items-center justify-between py-[11px]">
          <Shimmer className="h-[13px]" style={{ width }} />
          <Shimmer className="h-[13px] w-[46px]" />
        </div>
      ))}
    </div>
  )
}

function MenuItemRow({ item, index }: { item: MenuItem; index: number }) {
  const tags = [...item.dietaryTags, ...item.allergens].filter(Boolean)
  return (
    <div className="animate-fade-up py-1.5" style={{ animationDelay: `${Math.min(index * 0.07, 0.5)}s` }}>
      <div className="flex items-baseline">
        <span className="text-sm text-hubble-900">{item.name}</span>
        <span className="mx-2 flex-1 border-b border-dotted border-hubble-300 self-center" />
        <span className="shrink-0 text-sm font-medium text-hubble-800">
          {formatPrice(item.regularPrice, item.studentPrice)}
        </span>
      </div>
      {item.description && (
        <p className="mt-0.5 text-xs text-hubble-700/70">{item.description}</p>
      )}
      {tags.length > 0 && (
        <p className="mt-0.5 text-xs text-hubble-600/60">{tags.join(', ')}</p>
      )}
    </div>
  )
}

function CategoryBlock({ category }: { category: MenuCategoryWithItems }) {
  return (
    <div>
      <h3 className="mb-3 font-title text-xl font-bold text-hubble-700">{category.name}</h3>
      {category.availabilityNote && (
        <p className="mb-2 text-xs text-hubble-600/80">{category.availabilityNote}</p>
      )}
      <div>
        {category.items.map((item, i) => (
          <MenuItemRow key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}

export function MenuPage() {
  usePageSeo('Menu', 'The Hubble drinks and food menu, with TU/e student pricing.')
  const [tabs, setTabs] = useState<MenuTab[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getMenu('HUBBLE')
      .then((data) => {
        setTabs(data)
        if (data.length > 0) setActiveTabId(data[0].id)
      })
      .catch((err: unknown) => {
        void reportApiFailure('menu', err)
        setError(true)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <PageShell title="Menu" intro="Here you can find the menu of Hubble.">
      {/* Student discount banner */}
      <div className="my-6 rounded-xl bg-hubble-700 px-6 py-5 text-center text-white">
        <p className="font-semibold">TU/e Students are eligible for a discount on drinks</p>
        <p className="mt-1 text-sm italic opacity-90">Present your student card when ordering</p>
        <p className="mt-1 text-sm opacity-80">Regular price / TU/e student price</p>
      </div>

      {isLoading && <MenuSkeleton />}
      {error && (
        <p className="text-sm text-red-600">Could not load the menu. Please try again later.</p>
      )}

      {!isLoading && !error && tabs.length > 0 && (
        <>
          {/* Tab navigation */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab.id === activeTabId
                    ? 'border-hubble-700 bg-hubble-700 text-white'
                    : 'border-hubble-300 bg-white text-hubble-800 hover:border-hubble-700 hover:bg-hubble-700 hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {activeTab && (
            <div key={activeTab.id} className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {activeTab.categories.map((cat) => (
                <CategoryBlock key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && !error && tabs.length === 0 && (
        <p className="mt-4 text-sm text-hubble-700/60">
          The menu is being updated. Check back soon.
        </p>
      )}
    </PageShell>
  )
}
