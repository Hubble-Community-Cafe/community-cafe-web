import { useEffect, useState, useId } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchEvents, createEvent, updateEvent, deleteEvent,
  type BarLocation, type CafeEvent, type EventRequest,
} from '../lib/api'
import { PageHelp } from '../components/HelpGuide'
import { useChangedSince, useUnsavedChangesGuard } from '../lib/unsavedChanges'
import { useConfirmAction } from '../lib/confirmAction'
import { messageFor } from '../lib/actionError'

const BARS: BarLocation[] = ['HUBBLE', 'METEOR']

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function EventForm({
  bar,
  initial,
  onSave,
  onCancel,
}: {
  bar: BarLocation
  initial?: CafeEvent
  onSave: (req: EventRequest) => Promise<void>
  onCancel: () => void
}) {
  const formId = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [subscribeLink, setSubscribeLink] = useState(initial?.subscribeLink ?? '')
  const [published, setPublished] = useState(initial?.published ?? true)
  // Warn before leaving the page with unsaved input (UnsavedChangesProvider).
  useUnsavedChangesGuard(useChangedSince({ title, description, date, startTime, price, subscribeLink, published }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        bar,
        title,
        description: description || null,
        date,
        startTime: startTime || null,
        price: price || null,
        subscribeLink: subscribeLink || null,
        imageId: initial?.imageId ?? null,
        published,
      })
    } catch (err) {
      setError(messageFor(err, 'Failed to save event'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-title`} className="block text-xs font-medium text-slate-600">Title *</label>
          <input id={`${formId}-title`} value={title} onChange={(e) => setTitle(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Quiz Night" />
        </div>
        <div>
          <label htmlFor={`${formId}-date`} className="block text-xs font-medium text-slate-600">Date *</label>
          <input id={`${formId}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label htmlFor={`${formId}-start-time`} className="block text-xs font-medium text-slate-600">Start time</label>
          <input id={`${formId}-start-time`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label htmlFor={`${formId}-price`} className="block text-xs font-medium text-slate-600">Price</label>
          <input id={`${formId}-price`} value={price} onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Free / €5 / TBD" />
        </div>
        <div>
          <label htmlFor={`${formId}-signup-link`} className="block text-xs font-medium text-slate-600">Sign-up link</label>
          <input id={`${formId}-signup-link`} type="url" pattern="https?://.+" title="Start the link with https:// (for example https://forms.office.com/…)"
            value={subscribeLink} onChange={(e) => setSubscribeLink(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-description`} className="block text-xs font-medium text-slate-600">Description</label>
          <textarea id={`${formId}-description`} value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="A short description of the event…" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
            className="rounded" />
          Published (visible on the public site)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !title || !date}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save changes' : 'Create event'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} aria-label="Cancel"
          className="rounded bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          <X className="h-4 w-4" />
        </button>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  )
}

function EventRow({
  event, canEdit, onUpdated, onDeleted,
}: {
  event: CafeEvent
  canEdit: boolean
  onUpdated: (e: CafeEvent) => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const confirmAction = useConfirmAction()

  const handleDelete = () => confirmAction({
    title: 'Delete this event?',
    message: `"${event.title}" will be removed from the website.`,
    confirmLabel: 'Delete event',
    action: async () => {
      await deleteEvent(event.id)
      onDeleted()
    },
  })

  if (editing && canEdit) {
    return (
      <li className="py-3">
        <EventForm
          bar={event.bar}
          initial={event}
          onSave={async (req) => {
            const updated = await updateEvent(event.id, req)
            onUpdated(updated)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="flex items-start justify-between gap-4 border-t border-slate-100 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{formatDate(event.date)}{event.startTime ? `, ${event.startTime}` : ''}</p>
        <p className="mt-0.5 font-medium text-slate-800">
          {event.title}
          {!event.published && (
            <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Draft
            </span>
          )}
        </p>
        {event.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{event.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
          {event.price && <span>{event.price}</span>}
          {event.subscribeLink && <span>Has sign-up link</span>}
        </div>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setEditing(true)} aria-label={`Edit ${event.title}`}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} aria-label={`Delete ${event.title}`}
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  )
}

export function EventsPage() {
  const canEditContent = usePermissions().canEdit('EVENTS')
  const [bar, setBar] = useState<BarLocation>('HUBBLE')
  const [events, setEvents] = useState<CafeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // Switching bars quickly can leave the previous bar's request still running. Only the current
    // bar's answer may land, or Hubble's events would show under "Meteor events".
    let current = true
    setLoading(true)
    setError(null)
    fetchEvents(bar)
      .then((list) => { if (current) setEvents(list) })
      .catch(() => { if (current) setError('Failed to load events') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [bar])

  const handleCreated = (e: CafeEvent) => {
    setEvents((prev) => [e, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    setCreating(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <PageHelp />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Manage upcoming events for each bar. Published events appear on the public site.
        </p>
      </div>

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

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              {bar.charAt(0) + bar.slice(1).toLowerCase()} events
            </h2>
            {canEditContent && !creating && (
              <button onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600">
                <Plus className="h-4 w-4" /> Add event
              </button>
            )}
          </div>

          {canEditContent && creating && (
            <div className="mb-4">
              <EventForm
                bar={bar}
                onSave={async (req) => { handleCreated(await createEvent(req)) }}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          {events.length === 0 && !creating && (
            <p className="text-sm text-slate-500">No events yet.</p>
          )}

          <ul>
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                canEdit={canEditContent}
                onUpdated={(updated) => setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e))}
                onDeleted={() => setEvents((prev) => prev.filter((e) => e.id !== event.id))}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
