import { useEffect, useState } from 'react'
import { getTodaysDishes, type DailyDish } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'

export function DailyDishPage() {
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

      {isLoading && <p className="mt-6 text-sm text-hubble-700/60">Loading…</p>}
      {error && (
        <p className="mt-6 text-sm text-red-600">Could not load today's dish. Try again later.</p>
      )}

      {!isLoading && !error && dishes.length === 0 && (
        <p className="mt-6 text-sm text-hubble-700/60">No daily dish set for today yet.</p>
      )}

      {!isLoading && !error && dishes.length > 0 && (
        <div className="mt-6 space-y-4">
          {dishes.map((dish) => (
            <div key={dish.id} className="rounded-xl border border-hubble-100 bg-hubble-50 px-6 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-title text-xl font-bold text-hubble-700">{dish.name}</h2>
                {dish.price != null && (
                  <span className="shrink-0 text-lg font-semibold text-hubble-800">
                    €{dish.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              {dish.description && (
                <p className="mt-2 text-sm text-hubble-800/80">{dish.description}</p>
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
