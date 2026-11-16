import { useState, useId } from 'react'
import { Check, X } from 'lucide-react'
import { MediaPicker } from '../../components/MediaPicker'
import type { BoardMember, BoardMemberRequest, MediaAsset } from '../../lib/api'
import { useChangedSince, useUnsavedChangesGuard } from '../../lib/unsavedChanges'

// ── Member form ──────────────────────────────────────────────────────────────

export function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BoardMember
  onSave: (req: BoardMemberRequest) => Promise<void>
  onCancel: () => void
}) {
  const formId = useId()
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [photo, setPhoto] = useState<MediaAsset | null>(
    initial?.photoId != null
      ? { id: initial.photoId, url: initial.photoUrl ?? '', alt: initial.photoAlt ?? null,
          filename: '', contentType: '', sizeBytes: null, bar: null, createdAt: '' }
      : null,
  )
  // Warn before leaving the page with unsaved input (UnsavedChangesProvider).
  useUnsavedChangesGuard(useChangedSince({ name, role, photo: photo?.id }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      // Position is set by dragging: omitting it appends a new member and leaves an
      // existing one where they are.
      await onSave({ name, role: role || null, photoId: photo?.id ?? null })
    } catch {
      setError('Failed to save member')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-name`} className="block text-xs font-medium text-slate-600">Name *</label>
          <input id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Alice" />
        </div>
        <div>
          <label htmlFor={`${formId}-role`} className="block text-xs font-medium text-slate-600">Role</label>
          <input id={`${formId}-role`} value={role} onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="President" />
        </div>
        <div>
          <span id={`${formId}-photo`} className="block text-xs font-medium text-slate-600">Photo</span>
          <div role="group" aria-labelledby={`${formId}-photo`} className="mt-1">
            <MediaPicker value={photo} onChange={setPhoto} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !name}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save' : 'Add member'}
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

// ── Member row ───────────────────────────────────────────────────────────────
