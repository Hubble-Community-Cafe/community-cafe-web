import { useEffect, useState, useId } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { MediaPicker } from '../components/MediaPicker'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchAssociations, createAssociation, updateAssociation, deleteAssociation,
  type Association, type AssociationRequest, type BarLocation, type MediaAsset,
} from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { useChangedSince, useUnsavedChangesGuard } from '../lib/unsavedChanges'
import { useConfirmAction } from '../lib/confirmAction'
import { messageFor } from '../lib/actionError'

function AssociationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Association
  onSave: (req: AssociationRequest) => Promise<void>
  onCancel: () => void
}) {
  const formId = useId()
  const [name, setName] = useState(initial?.name ?? '')
  const [bar, setBar] = useState<BarLocation | ''>(initial?.bar ?? '')
  const [logo, setLogo] = useState<MediaAsset | null>(
    initial?.logoId != null
      ? { id: initial.logoId, url: initial.logoUrl ?? '', alt: initial.logoAlt ?? null,
          filename: '', contentType: '', sizeBytes: null, bar: null, createdAt: '' }
      : null,
  )
  // Warn before leaving the page with unsaved input (UnsavedChangesProvider).
  useUnsavedChangesGuard(useChangedSince({ name, bar, logo: logo?.id }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), logoId: logo?.id ?? null, bar: bar || null })
    } catch (err) {
      setError(messageFor(err, 'Failed to save association'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-name`} className="block text-xs font-medium text-slate-600">Name *</label>
          <input id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Inter Actief" />
        </div>
        <div>
          <label htmlFor={`${formId}-bar`} className="block text-xs font-medium text-slate-600">Bar (blank = both)</label>
          <select id={`${formId}-bar`} value={bar} onChange={(e) => setBar(e.target.value as BarLocation | '')}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <option value="">Both</option>
            <option value="HUBBLE">Hubble</option>
            <option value="METEOR">Meteor</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <span id={`${formId}-logo`} className="block text-xs font-medium text-slate-600">Logo</span>
          <div role="group" aria-labelledby={`${formId}-logo`} className="mt-1">
            <MediaPicker value={logo} onChange={setLogo} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save changes' : 'Add association'}
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

function AssociationRow({
  association, canEdit, onUpdated, onDeleted,
}: {
  association: Association
  canEdit: boolean
  onUpdated: (a: Association) => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const confirmAction = useConfirmAction()

  const handleDelete = () => confirmAction({
    title: 'Delete this association?',
    message: `"${association.name}" will be removed from the associations page.`,
    confirmLabel: 'Delete association',
    action: async () => {
      await deleteAssociation(association.id)
      onDeleted()
    },
  })

  if (editing && canEdit) {
    return (
      <li className="py-3">
        <AssociationForm
          initial={association}
          onSave={async (req) => {
            const updated = await updateAssociation(association.id, req)
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
      {association.logoUrl ? (
        <img src={association.logoUrl} alt={association.logoAlt ?? association.name}
          className="h-10 w-16 shrink-0 rounded object-contain" />
      ) : (
        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-500">
          {association.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{association.name}</p>
        {association.bar && (
          <p className="mt-0.5 text-xs text-slate-500">
            {association.bar === 'HUBBLE' ? 'Hubble only' : 'Meteor only'}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => setEditing(true)} aria-label={`Edit ${association.name}`}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} aria-label={`Delete ${association.name}`}
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  )
}

export function AssociationsPage() {
  const canEditContent = usePermissions().canEdit('ASSOCIATIONS')
  const [associations, setAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchAssociations()
      .then(setAssociations)
      .catch(() => setError('Failed to load associations'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Associations"
        description="Manage connected study associations. Sorted alphabetically on the public site. Bar left blank means shown on both sites."
      />

      {canEditContent && (
        <div className="flex justify-end">
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600">
              <Plus className="h-4 w-4" /> Add association
            </button>
          )}
        </div>
      )}

      {canEditContent && creating && (
        <AssociationForm
          onSave={async (req) => {
            const created = await createAssociation(req)
            setAssociations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {associations.length === 0 && !creating && (
            <p className="text-sm text-slate-500">No associations yet.</p>
          )}
          <ul>
            {associations.map((a) => (
              <AssociationRow
                key={a.id}
                association={a}
                canEdit={canEditContent}
                onUpdated={(updated) =>
                  setAssociations((prev) =>
                    prev.map((x) => x.id === updated.id ? updated : x)
                       .sort((x, y) => x.name.localeCompare(y.name))
                  )
                }
                onDeleted={() => setAssociations((prev) => prev.filter((x) => x.id !== a.id))}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
