import { useState, useId } from 'react'
import { Check, X } from 'lucide-react'
import { MediaPicker } from '../../components/MediaPicker'
import type { BoardTerm, BoardTermRequest, BarLocation, BoardType, MediaAsset } from '../../lib/api'
import { useChangedSince, useUnsavedChangesGuard } from '../../lib/unsavedChanges'
import { messageFor } from '../../lib/actionError'

export function TermForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BoardTerm
  onSave: (req: BoardTermRequest) => Promise<void>
  onCancel: () => void
}) {
  const formId = useId()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [type, setType] = useState<BoardType>(initial?.type ?? 'EXECUTIVE')
  const [bar, setBar] = useState<BarLocation | ''>(initial?.bar ?? '')
  const [current, setCurrent] = useState(initial?.current ?? false)
  const [photoCredit, setPhotoCredit] = useState(initial?.photoCredit ?? '')
  const [groupPhoto, setGroupPhoto] = useState<MediaAsset | null>(
    initial?.groupPhotoId != null
      ? { id: initial.groupPhotoId, url: initial.groupPhotoUrl ?? '', alt: initial.groupPhotoAlt ?? null,
          filename: '', contentType: '', sizeBytes: null, bar: null, createdAt: '' }
      : null,
  )
  // Warn before leaving the page with unsaved input (UnsavedChangesProvider).
  useUnsavedChangesGuard(useChangedSince({ label, type, bar, current, photoCredit, groupPhoto: groupPhoto?.id }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        // Position is set by dragging: omitting it appends a new term and leaves an
        // existing one where it is.
        label, type, bar: bar || null, current,
        groupPhotoId: groupPhoto?.id ?? null,
        photoCredit: photoCredit || null,
      })
    } catch (err) {
      setError(messageFor(err, 'Failed to save term'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-label`} className="block text-xs font-medium text-slate-600">Label *</label>
          <input id={`${formId}-label`} value={label} onChange={(e) => setLabel(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Board 2025 - September" />
        </div>
        <div>
          <label htmlFor={`${formId}-type`} className="block text-xs font-medium text-slate-600">Type</label>
          <select id={`${formId}-type`} value={type} onChange={(e) => setType(e.target.value as BoardType)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <option value="EXECUTIVE">Executive board</option>
            <option value="SUPERVISORY">Supervisory board</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-bar`} className="block text-xs font-medium text-slate-600">Bar (blank = shared)</label>
          <select id={`${formId}-bar`} value={bar} onChange={(e) => setBar(e.target.value as BarLocation | '')}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <option value="">Shared</option>
            <option value="HUBBLE">Hubble</option>
            <option value="METEOR">Meteor</option>
          </select>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)}
              className="rounded" />
            Current term
          </label>
        </div>
        <div className="sm:col-span-2">
          <span id={`${formId}-group-photo`} className="block text-xs font-medium text-slate-600">Group photo</span>
          <div role="group" aria-labelledby={`${formId}-group-photo`} className="mt-1">
            <MediaPicker value={groupPhoto} onChange={setGroupPhoto} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Shown on the previous-boards page for this term.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-photo-credit`} className="block text-xs font-medium text-slate-600">Photo credit</label>
          <input id={`${formId}-photo-credit`} value={photoCredit} onChange={(e) => setPhotoCredit(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Photos by Jane Doe / Studio X" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !label}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save changes' : 'Create term'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} aria-label="Cancel"
          className="rounded bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          <X className="h-4 w-4" />
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  )
}

// ── Term card ────────────────────────────────────────────────────────────────
