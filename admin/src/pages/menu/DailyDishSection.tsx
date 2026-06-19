import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  fetchDailyDishes,
  createDailyDish,
  updateDailyDish,
  deleteDailyDish,
  type DailyDish,
  type DailyDishRequest,
} from '../../lib/api'

function DishForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DailyDish
  onSave: (req: DailyDishRequest) => Promise<void>
  onCancel: () => void
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        date,
        name: name.trim(),
        description: description.trim() || null,
        price: price.trim() ? parseFloat(price) : null,
        imageId: null,
      })
    } catch {
      setError('Could not save daily dish.')
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-hubble-100 bg-hubble-50 p-4 space-y-3"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Dish name</label>
          <input
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Price (€) <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-hubble-700 px-4 py-2 text-sm font-semibold text-white hover:bg-hubble-800 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export function DailyDishSection({ canEdit = true }: { canEdit?: boolean }) {
  const [dishes, setDishes] = useState<DailyDish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<DailyDish | null>(null)
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    try {
      setDishes(await fetchDailyDishes())
      setError(null)
    } catch {
      setError('Failed to load daily dishes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (req: DailyDishRequest) => {
    const dish = await createDailyDish(req)
    setDishes((prev) => [...prev, dish].sort((a, b) => a.date.localeCompare(b.date)))
    setShowNew(false)
  }

  const handleUpdate = async (req: DailyDishRequest) => {
    if (!editing) return
    const dish = await updateDailyDish(editing.id, req)
    setDishes((prev) => prev.map((d) => (d.id === dish.id ? dish : d)))
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this daily dish?')) return
    await deleteDailyDish(id)
    setDishes((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => { setShowNew(true); setEditing(null) }}
            className="flex items-center gap-1.5 rounded-lg bg-hubble-700 px-3 py-2 text-sm font-semibold text-white hover:bg-hubble-800"
          >
            <Plus className="h-4 w-4" /> Add dish
          </button>
        </div>
      )}

      {canEdit && showNew && (
        <div className="mb-4">
          <DishForm onSave={handleCreate} onCancel={() => setShowNew(false)} />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : dishes.length === 0 && !showNew ? (
        <p className="text-sm text-slate-500">No upcoming daily dishes.</p>
      ) : (
        <div className="space-y-2">
          {dishes.map((dish) => (
            <div key={dish.id}>
              {canEdit && editing?.id === dish.id ? (
                <DishForm
                  initial={dish}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">{dish.date}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm text-slate-800">{dish.name}</span>
                    {dish.price != null && (
                      <span className="ml-2 text-sm text-slate-500">€{dish.price.toFixed(2)}</span>
                    )}
                    {dish.description && (
                      <p className="mt-0.5 text-xs text-slate-400">{dish.description}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(dish); setShowNew(false) }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
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
  )
}
