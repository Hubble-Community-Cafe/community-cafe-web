import { useEffect, useState } from 'react'
import { getTodaysDishes, type DailyDish } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { Shimmer } from '../components/Shimmer'
import { usePageSeo } from '../lib/seo'

/** A small light-teal "Today" pill with a single pulsing dot. */
function TodayTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-hubble-100 px-2.5 py-0.5 text-xs font-semibold text-hubble-800">
      <span className="relative flex h-2 w-2">
        <span className="animate-pulsering absolute inline-flex h-full w-full rounded-full bg-hubble-700" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-hubble-700" />
      </span>
      Today
    </span>
  )
}

export function DailyDishPage() {
  usePageSeo('Daily Dinner Dish', 'Today’s affordable dinner dish at Hubble Community Cafe.')
  const [dishes, setDishes] = useState<DailyDish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getTodaysDishes()
      .then(setDishes)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <PageShell title="Daily Dinner Dish">
      <p className="mt-3 text-hubble-800/80">
        Once the Daily Dinner Dish is known this will be posted below:
      </p>

      {isLoading && (
        <div className="mt-6 space-y-3" data-testid="dish-skeleton">
          <Shimmer className="h-5 w-20 rounded-full" />
          <Shimmer className="h-28 w-full max-w-md rounded-2xl" />
        </div>
      )}
      {error && (
        <p className="mt-6 text-sm text-red-600">Could not load today's dish. Try again later.</p>
      )}

      {!isLoading && !error && dishes.length === 0 && (
        <p className="mt-6 text-sm text-hubble-700/60">No daily dish set for today yet.</p>
      )}

      {!isLoading && !error && dishes.length > 0 && (
        <div className="mt-6 space-y-4">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="rounded-2xl px-6 py-5 text-white shadow-lg"
              style={{ background: 'linear-gradient(150deg, #0c3d50, #0f4d64)' }}
            >
              <TodayTag />
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h2 className="font-title text-2xl font-bold text-white">{dish.name}</h2>
                {dish.price != null && (
                  <span className="shrink-0 text-lg font-semibold text-hubble-100">
                    €{dish.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              {dish.description && (
                <p className="mt-2 text-sm text-white/85">{dish.description}</p>
              )}
              {dish.imageUrl && (
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="mt-4 w-full max-w-sm rounded-xl object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
