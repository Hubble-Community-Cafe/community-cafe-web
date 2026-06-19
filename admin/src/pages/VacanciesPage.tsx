import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { MediaPicker } from '../components/MediaPicker'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchVacancies, createVacancy, updateVacancy, deleteVacancy,
  type Vacancy, type VacancyRequest, type BarLocation, type MediaAsset,
} from '../lib/api'

const BAR_LABELS: Record<string, string> = { HUBBLE: 'Hubble', METEOR: 'Meteor' }

function VacancyForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Vacancy
  onSave: (req: VacancyRequest) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [hours, setHours] = useState(initial?.hours ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [applyEmail, setApplyEmail] = useState(initial?.applyEmail ?? '')
  const [applyLink, setApplyLink] = useState(initial?.applyLink ?? '')
  const [bar, setBar] = useState<BarLocation | ''>(initial?.bar ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0)
  const [image, setImage] = useState<MediaAsset | null>(
    initial?.imageId != null
      ? { id: initial.imageId, url: initial.imageUrl ?? '', alt: initial.imageAlt ?? null,
          filename: '', contentType: '', sizeBytes: null, bar: null, createdAt: '' }
      : null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title,
        description: description || null,
        hours: hours || null,
        type: type || null,
        applyEmail: applyEmail || null,
        applyLink: applyLink || null,
        imageId: image?.id ?? null,
        bar: bar || null,
        active,
        sortOrder,
      })
    } catch {
      setError('Failed to save vacancy')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Manager" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Bar (blank = both)</label>
          <select value={bar} onChange={(e) => setBar(e.target.value as BarLocation | '')}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <option value="">Both</option>
            <option value="HUBBLE">Hubble</option>
            <option value="METEOR">Meteor</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Sort order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Hours</label>
          <input value={hours} onChange={(e) => setHours(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="10-15 hrs/week" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Paid" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Apply e-mail</label>
          <input type="email" value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="jobs@hubble.cafe" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Apply link</label>
          <input value={applyLink} onChange={(e) => setApplyLink(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Short description of the role…" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Photo</label>
          <div className="mt-1">
            <MediaPicker value={image} onChange={setImage} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
            className="rounded" />
          Active (visible on the public site)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !title}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save changes' : 'Add vacancy'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="rounded bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          <X className="h-4 w-4" />
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  )
}

function VacancyRow({
  vacancy, canEdit, onUpdated, onDeleted,
}: {
  vacancy: Vacancy
  canEdit: boolean
  onUpdated: (v: Vacancy) => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete vacancy "${vacancy.title}"?`)) return
    setDeleting(true)
    try {
      await deleteVacancy(vacancy.id)
      onDeleted()
    } catch {
      setDeleting(false)
    }
  }

  if (editing && canEdit) {
    return (
      <li className="py-3">
        <VacancyForm
          initial={vacancy}
          onSave={async (req) => {
            const updated = await updateVacancy(vacancy.id, req)
            onUpdated(updated)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="flex items-center gap-4 border-t border-slate-100 py-3">
      {vacancy.imageUrl ? (
        <img src={vacancy.imageUrl} alt={vacancy.imageAlt ?? vacancy.title}
          className="h-12 w-12 shrink-0 rounded object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-400">
          {vacancy.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-800">{vacancy.title}</p>
          {!vacancy.active && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
              Inactive
            </span>
          )}
          {vacancy.bar && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {BAR_LABELS[vacancy.bar] ?? vacancy.bar}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          {[vacancy.hours, vacancy.type].filter(Boolean).join(' · ') || 'No details'}
        </p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => setEditing(true)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  )
}

export function VacanciesPage() {
  const { canEditContent } = usePermissions()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchVacancies()
      .then(setVacancies)
      .catch(() => setError('Failed to load vacancies'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vacancies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage open positions. Active vacancies appear on the public site. Bar left blank means shown on both sites.
        </p>
      </div>

      {canEditContent && (
        <div className="flex justify-end">
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600">
              <Plus className="h-4 w-4" /> Add vacancy
            </button>
          )}
        </div>
      )}

      {canEditContent && creating && (
        <VacancyForm
          onSave={async (req) => {
            const created = await createVacancy(req)
            setVacancies((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)))
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {vacancies.length === 0 && !creating && (
            <p className="text-sm text-slate-400">No vacancies yet.</p>
          )}
          <ul>
            {vacancies.map((v) => (
              <VacancyRow
                key={v.id}
                vacancy={v}
                canEdit={canEditContent}
                onUpdated={(updated) => setVacancies((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                onDeleted={() => setVacancies((prev) => prev.filter((x) => x.id !== v.id))}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
