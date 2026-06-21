import { useId, useState } from 'react'
import type { BarLocation, MenuCategory, MenuCategoryRequest, MenuKind } from '../../lib/api'

interface Props {
  initial?: MenuCategory
  defaultBar: BarLocation
  defaultSortOrder: number
  /** When set, this form creates/edits a sub-category; bar selector is hidden. */
  fixedParentId?: number
  onSave: (req: MenuCategoryRequest) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ initial, defaultBar, defaultSortOrder, fixedParentId, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<MenuKind>(initial?.kind ?? 'DRINK')
  const [note, setNote] = useState(initial?.availabilityNote ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? defaultSortOrder)
  const [bar, setBar] = useState<BarLocation | 'SHARED'>(initial?.bar ?? defaultBar)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameId = useId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        kind,
        availabilityNote: note.trim() || null,
        sortOrder,
        bar: fixedParentId !== undefined ? (initial?.bar ?? null) : bar === 'SHARED' ? null : bar,
        parentId: fixedParentId ?? initial?.parentId ?? null,
      })
    } catch {
      setError('Could not save category.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            id={nameId}
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as MenuKind)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="DRINK">Drink</option>
            <option value="FOOD">Food</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Availability note <span className="text-slate-400">(optional)</span>
          </label>
          <input
            maxLength={255}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Weekdays only"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sort order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {fixedParentId === undefined && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Visible on</label>
              <select
                value={bar}
                onChange={(e) => setBar(e.target.value as BarLocation | 'SHARED')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="HUBBLE">Hubble</option>
                <option value="METEOR">Meteor</option>
                <option value="SHARED">Both</option>
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
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
