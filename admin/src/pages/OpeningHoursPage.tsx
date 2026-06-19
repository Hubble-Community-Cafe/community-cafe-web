import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchWeeklyHours, upsertDay, closeDay,
  fetchOverrides, createOverride, deleteOverride,
  type BarLocation, type DayOfWeek, type WeeklyHours, type HoursOverride,
} from '../lib/api'

const BARS: BarLocation[] = ['HUBBLE', 'METEOR']
const DAYS: DayOfWeek[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-slate-200 px-2 py-1 text-sm tabular-nums"
    />
  )
}

function DayRow({
  bar, day, slot, canEdit, onSaved,
}: {
  bar: BarLocation
  day: DayOfWeek
  slot: WeeklyHours | undefined
  canEdit: boolean
  onSaved: (updated: WeeklyHours | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(slot?.open ?? '11:00')
  const [close, setClose] = useState(slot?.close ?? '23:00')
  const [kitchenOpen, setKitchenOpen] = useState(slot?.kitchenOpen ?? '')
  const [kitchenClose, setKitchenClose] = useState(slot?.kitchenClose ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = () => {
    setOpen(slot?.open ?? '11:00')
    setClose(slot?.close ?? '23:00')
    setKitchenOpen(slot?.kitchenOpen ?? '')
    setKitchenClose(slot?.kitchenClose ?? '')
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await upsertDay(bar, day, {
        open, close,
        kitchenOpen: kitchenOpen || null,
        kitchenClose: kitchenClose || null,
      })
      onSaved(updated)
      setEditing(false)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const markClosed = async () => {
    setSaving(true)
    setError(null)
    try {
      await closeDay(bar, day)
      onSaved(null)
      setEditing(false)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (editing && canEdit) {
    return (
      <tr className="border-t border-slate-100">
        <td className="py-2 pr-4 text-sm font-medium text-slate-700">{DAY_LABELS[day]}</td>
        <td className="py-2 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <TimeInput value={open} onChange={setOpen} />
            <span className="text-slate-400">–</span>
            <TimeInput value={close} onChange={setClose} />
          </div>
        </td>
        <td className="py-2 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <TimeInput value={kitchenOpen} onChange={setKitchenOpen} />
            <span className="text-slate-400">–</span>
            <TimeInput value={kitchenClose} onChange={setKitchenClose} />
          </div>
        </td>
        <td className="py-2">
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1 rounded bg-hubble-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => setEditing(false)} disabled={saving}
              className="rounded bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
              <X className="h-3.5 w-3.5" />
            </button>
            {slot && (
              <button onClick={markClosed} disabled={saving}
                className="rounded bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                Mark closed
              </button>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="py-2.5 pr-4 text-sm font-medium text-slate-700">{DAY_LABELS[day]}</td>
      <td className="py-2.5 pr-2 text-sm text-slate-600">
        {slot ? `${slot.open} – ${slot.close}` : <span className="text-slate-400">Closed</span>}
      </td>
      <td className="py-2.5 pr-2 text-sm text-slate-600">
        {slot?.kitchenOpen || slot?.kitchenClose
          ? `${slot.kitchenOpen ?? '–'} – ${slot.kitchenClose ?? '–'}`
          : <span className="text-slate-400">–</span>}
      </td>
      <td className="py-2.5">
        {canEdit && (
          <button onClick={startEdit}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">
            <Pencil className="h-3.5 w-3.5" /> {slot ? 'Edit' : 'Set hours'}
          </button>
        )}
      </td>
    </tr>
  )
}

function OverrideForm({
  bar, onCreated,
}: {
  bar: BarLocation
  onCreated: (o: HoursOverride) => void
}) {
  const [date, setDate] = useState('')
  const [closed, setClosed] = useState(true)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    setError(null)
    try {
      const created = await createOverride(bar, { date, closed, open: null, close: null, note: note || null })
      onCreated(created)
      setDate('')
      setNote('')
      setClosed(true)
    } catch {
      setError('Failed to create override')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
          className="mt-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Status</label>
        <select value={closed ? 'closed' : 'open'} onChange={(e) => setClosed(e.target.value === 'closed')}
          className="mt-1 rounded border border-slate-200 px-2 py-1.5 text-sm">
          <option value="closed">Closed</option>
          <option value="open">Special hours (open)</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">Note (optional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bank holiday, Special event"
          className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" disabled={saving || !date}
        className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
        <Plus className="h-4 w-4" /> Add
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  )
}

export function OpeningHoursPage() {
  const { canEditContent } = usePermissions()
  const [bar, setBar] = useState<BarLocation>('HUBBLE')
  const [slots, setSlots] = useState<WeeklyHours[]>([])
  const [overrides, setOverrides] = useState<HoursOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (b: BarLocation) => {
    setLoading(true)
    setError(null)
    try {
      const [h, o] = await Promise.all([fetchWeeklyHours(b), fetchOverrides(b)])
      setSlots(h)
      setOverrides(o)
    } catch {
      setError('Failed to load opening hours')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(bar) }, [bar])

  const handleDaySaved = (day: DayOfWeek, updated: WeeklyHours | null) => {
    setSlots((prev) => {
      const rest = prev.filter((s) => s.dayOfWeek !== day)
      return updated ? [...rest, updated] : rest
    })
  }

  const handleOverrideCreated = (o: HoursOverride) => {
    setOverrides((prev) => [...prev, o].sort((a, b) => a.date.localeCompare(b.date)))
  }

  const handleDeleteOverride = async (id: number) => {
    try {
      await deleteOverride(id)
      setOverrides((prev) => prev.filter((o) => o.id !== id))
    } catch {
      // silently ignore — user can retry
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Opening Hours</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set the regular weekly schedule and add one-off date overrides for closures or special hours.
        </p>
      </div>

      {/* Bar selector */}
      <div className="flex gap-2">
        {BARS.map((b) => (
          <button key={b} onClick={() => setBar(b)}
            className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${
              b === bar
                ? 'border-hubble-700 bg-hubble-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-hubble-700'
            }`}>
            {b.charAt(0) + b.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {/* Weekly schedule */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Weekly schedule</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Day</th>
                  <th className="pb-2 pr-2">Open – Close</th>
                  <th className="pb-2 pr-2">Kitchen open – close</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <DayRow
                    key={day}
                    bar={bar}
                    day={day}
                    slot={slots.find((s) => s.dayOfWeek === day)}
                    canEdit={canEditContent}
                    onSaved={(updated) => handleDaySaved(day, updated)}
                  />
                ))}
              </tbody>
            </table>
          </section>

          {/* Date overrides */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-slate-800">Date overrides</h2>
            <p className="text-xs text-slate-500">
              Override the schedule for a specific date. Closed overrides take precedence over the weekly schedule.
            </p>
            {overrides.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">No upcoming overrides.</p>
            )}
            {overrides.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100">
                {overrides.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="text-sm font-medium text-slate-700">{o.date}</span>
                      <span className={`ml-3 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        o.closed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                      }`}>
                        {o.closed ? 'Closed' : 'Open'}
                      </span>
                      {o.note && <span className="ml-2 text-xs text-slate-500">{o.note}</span>}
                    </div>
                    {canEditContent && (
                      <button onClick={() => handleDeleteOverride(o.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canEditContent && <OverrideForm bar={bar} onCreated={handleOverrideCreated} />}
          </section>
        </>
      )}
    </div>
  )
}
