import { useId, useState } from 'react'
import type { MenuItem, MenuItemRequest } from '../../lib/api'

interface Props {
  initial?: MenuItem
  defaultSortOrder: number
  onSave: (req: MenuItemRequest) => Promise<void>
  onCancel: () => void
}

function csvToList(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function listToCsv(list: string[]): string {
  return list.join(', ')
}

export function ItemForm({ initial, defaultSortOrder, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [regularPrice, setRegularPrice] = useState(
    initial ? String(initial.regularPrice) : '',
  )
  const [studentPrice, setStudentPrice] = useState(
    initial?.studentPrice != null ? String(initial.studentPrice) : '',
  )
  const [sizeOptions, setSizeOptions] = useState(listToCsv(initial?.sizeOptions ?? []))
  const [dietaryTags, setDietaryTags] = useState(listToCsv(initial?.dietaryTags ?? []))
  const [allergens, setAllergens] = useState(listToCsv(initial?.allergens ?? []))
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? defaultSortOrder)
  const [active, setActive] = useState(initial?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameId = useId()
  const regularId = useId()
  const studentId = useId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const reg = parseFloat(regularPrice)
    const stu = studentPrice.trim() ? parseFloat(studentPrice) : null
    if (isNaN(reg) || reg < 0) {
      setError('Regular price must be a valid non-negative number.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        regularPrice: reg,
        studentPrice: stu,
        sizeOptions: csvToList(sizeOptions),
        dietaryTags: csvToList(dietaryTags),
        allergens: csvToList(allergens),
        imageId: null,
        sortOrder,
        active,
      })
    } catch {
      setError('Could not save item.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={nameId} className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            id={nameId}
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
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
        <div>
          <label htmlFor={regularId} className="mb-1 block text-xs font-medium text-slate-600">
            Regular price (€)
          </label>
          <input
            id={regularId}
            required
            type="number"
            step="0.01"
            min="0"
            value={regularPrice}
            onChange={(e) => setRegularPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={studentId} className="mb-1 block text-xs font-medium text-slate-600">
            TU/e student price (€) <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id={studentId}
            type="number"
            step="0.01"
            min="0"
            value={studentPrice}
            onChange={(e) => setStudentPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Size options <span className="text-slate-400">(comma-separated)</span>
          </label>
          <input
            value={sizeOptions}
            onChange={(e) => setSizeOptions(e.target.value)}
            placeholder="0.25L, 0.5L"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Dietary tags <span className="text-slate-400">(comma-separated)</span>
          </label>
          <input
            value={dietaryTags}
            onChange={(e) => setDietaryTags(e.target.value)}
            placeholder="vegan, gluten-free"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Allergens <span className="text-slate-400">(comma-separated)</span>
          </label>
          <input
            value={allergens}
            onChange={(e) => setAllergens(e.target.value)}
            placeholder="nuts, dairy"
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
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Active
            </label>
          </div>
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
