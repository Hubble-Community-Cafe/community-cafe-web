import { useId, useState } from 'react'
import { FolderInput, Tag, X } from 'lucide-react'
import type { MenuCategory, MenuItem } from '../../lib/api'

/** Sub-headings the selection can move into, grouped under the tab they belong to. */
export interface MoveTargetGroup {
  tabName: string
  categories: MenuCategory[]
}

interface Props {
  selected: MenuItem[]
  moveTargets: MoveTargetGroup[]
  onSetPrice: (req: {
    regularPrice: number | null
    studentPrice: number | null
    clearStudentPrice: boolean
  }) => Promise<void>
  onMove: (categoryId: number) => Promise<void>
  onClear: () => void
}

/** "Mojito, Negroni and 4 more", so the panel says what it is about to change without a wall of text. */
function describe(items: MenuItem[]): string {
  const names = items.map((i) => i.name)
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

/**
 * Actions for a selection of menu items: set one price across all of them, or move them to another
 * sub-heading. Both panels name the items they will change and stay open until Apply, which is the
 * confirmation step: nothing is written while you are still typing a price.
 *
 * Rendered inline above the item list rather than pinned to the viewport. The list sits inside two
 * nested accordion panels, and a sticky element inside those clips unpredictably.
 */
export function BulkActionBar({ selected, moveTargets, onSetPrice, onMove, onClear }: Props) {
  const [panel, setPanel] = useState<'none' | 'price' | 'move'>('none')
  const [regular, setRegular] = useState('')
  const [student, setStudent] = useState('')
  const [clearStudent, setClearStudent] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const regularId = useId()
  const studentId = useId()
  const targetSelectId = useId()

  const close = () => {
    setPanel('none')
    setRegular('')
    setStudent('')
    setClearStudent(false)
    setTargetId('')
    setError(null)
  }

  const applyPrice = async () => {
    const reg = regular.trim() ? Number(regular) : null
    const stu = student.trim() ? Number(student) : null
    if (reg === null && stu === null && !clearStudent) {
      setError('Enter a price, or tick "remove the student price".')
      return
    }
    if ((reg !== null && (isNaN(reg) || reg < 0)) || (stu !== null && (isNaN(stu) || stu < 0))) {
      setError('Prices must be zero or more.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSetPrice({ regularPrice: reg, studentPrice: stu, clearStudentPrice: clearStudent })
      close()
    } catch {
      setError('Could not update those prices. Please try again.')
      setBusy(false)
    }
  }

  const applyMove = async () => {
    if (!targetId) {
      setError('Choose a sub-category to move them to.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onMove(Number(targetId))
      close()
    } catch {
      setError('Could not move those items. Please try again.')
      setBusy(false)
    }
  }

  const count = selected.length

  return (
    <div className="mb-3 rounded-xl border border-hubble-200 bg-hubble-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">
          {count} {count === 1 ? 'item' : 'items'} selected
        </span>
        <span className="hidden text-xs text-slate-500 sm:inline">{describe(selected)}</span>

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setPanel(panel === 'price' ? 'none' : 'price'); setError(null) }}
            aria-expanded={panel === 'price'}
            className="flex items-center gap-1.5 rounded-lg bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-800"
          >
            <Tag className="h-3.5 w-3.5" /> Set price
          </button>
          <button
            type="button"
            onClick={() => { setPanel(panel === 'move' ? 'none' : 'move'); setError(null) }}
            aria-expanded={panel === 'move'}
            disabled={moveTargets.length === 0}
            title={moveTargets.length === 0 ? 'There is no other sub-category to move these to.' : undefined}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FolderInput className="h-3.5 w-3.5" /> Move to
          </button>
          <button
            type="button"
            onClick={() => { close(); onClear() }}
            aria-label="Clear selection"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {panel === 'price' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={regularId} className="mb-1 block text-xs font-medium text-slate-600">
                Regular price (€) <span className="text-slate-400">(leave blank to keep)</span>
              </label>
              <input
                id={regularId}
                type="number"
                step="0.01"
                min="0"
                value={regular}
                onChange={(e) => setRegular(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor={studentId} className="mb-1 block text-xs font-medium text-slate-600">
                TU/e student price (€) <span className="text-slate-400">(leave blank to keep)</span>
              </label>
              <input
                id={studentId}
                type="number"
                step="0.01"
                min="0"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                disabled={clearStudent}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={clearStudent}
              onChange={(e) => { setClearStudent(e.target.checked); if (e.target.checked) setStudent('') }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Remove the TU/e student price from these items
          </label>
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-slate-500">Applies to {describe(selected)}.</span>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyPrice}
              disabled={busy}
              className="rounded-lg bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-800 disabled:opacity-60"
            >
              {busy ? 'Saving…' : `Apply to ${count} ${count === 1 ? 'item' : 'items'}`}
            </button>
          </div>
        </div>
      )}

      {panel === 'move' && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <label htmlFor={targetSelectId} className="mb-1 block text-xs font-medium text-slate-600">
            Move to sub-category
          </label>
          <select
            id={targetSelectId}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Choose one…</option>
            {moveTargets.map((group) => (
              <optgroup key={group.tabName} label={group.tabName}>
                {group.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-slate-500">Moves {describe(selected)}.</span>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyMove}
              disabled={busy}
              className="rounded-lg bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-800 disabled:opacity-60"
            >
              {busy ? 'Moving…' : `Move ${count} ${count === 1 ? 'item' : 'items'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
