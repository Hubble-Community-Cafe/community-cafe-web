import { type ReactNode, useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { MediaPicker } from '../components/MediaPicker'
import { SortableList } from '../components/SortableList'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchBoardTerms, createBoardTerm, updateBoardTerm, deleteBoardTerm,
  createBoardMember, updateBoardMember, deleteBoardMember,
  reorderBoardTerms, reorderBoardMembers,
  type BoardTerm, type BoardMember, type BoardTermRequest, type BoardMemberRequest,
  type BarLocation, type BoardType, type MediaAsset,
} from '../lib/api'

const TYPE_LABELS: Record<BoardType, string> = {
  EXECUTIVE: 'Executive board',
  SUPERVISORY: 'Supervisory board',
}
const BAR_LABELS: Record<string, string> = {
  HUBBLE: 'Hubble',
  METEOR: 'Meteor',
}

function termScope(term: BoardTerm): string {
  if (term.bar) return BAR_LABELS[term.bar] ?? term.bar
  return 'Shared'
}

// ── Member form ──────────────────────────────────────────────────────────────

function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BoardMember
  onSave: (req: BoardMemberRequest) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [photo, setPhoto] = useState<MediaAsset | null>(
    initial?.photoId != null
      ? { id: initial.photoId, url: initial.photoUrl ?? '', alt: initial.photoAlt ?? null,
          filename: '', contentType: '', sizeBytes: null, bar: null, createdAt: '' }
      : null,
  )
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
          <label className="block text-xs font-medium text-slate-600">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Alice" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="President" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Photo</label>
          <div className="mt-1">
            <MediaPicker value={photo} onChange={setPhoto} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !name}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save' : 'Add member'}
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

// ── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  canEdit,
  handle,
  onEditingChange,
  onUpdated,
  onDeleted,
}: {
  member: BoardMember
  canEdit: boolean
  /** Drag handle from the surrounding SortableList; null for a viewer or while editing. */
  handle: ReactNode
  onEditingChange: (editing: boolean) => void
  onUpdated: (m: BoardMember) => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const setEditingState = (value: boolean) => {
    setEditing(value)
    onEditingChange(value)
  }

  if (editing && canEdit) {
    return (
      <div className="py-2">
        <MemberForm
          initial={member}
          onSave={async (req) => {
            const updated = await updateBoardMember(member.id, req)
            onUpdated(updated)
            setEditingState(false)
          }}
          onCancel={() => setEditingState(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-t border-slate-100 py-2">
      {handle}
      {member.photoUrl ? (
        <img src={member.photoUrl} alt={member.photoAlt ?? member.name}
          className="h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
          {member.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{member.name}</p>
        {member.role && <p className="text-xs text-slate-500">{member.role}</p>}
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => setEditingState(true)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={async () => {
            if (!confirm(`Remove "${member.name}"?`)) return
            setDeleting(true)
            try { await deleteBoardMember(member.id); onDeleted() }
            catch { setDeleting(false) }
          }} disabled={deleting}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Term form ────────────────────────────────────────────────────────────────

function TermForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BoardTerm
  onSave: (req: BoardTermRequest) => Promise<void>
  onCancel: () => void
}) {
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
    } catch {
      setError('Failed to save term')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Label *</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Board 2025 - September" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as BoardType)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <option value="EXECUTIVE">Executive board</option>
            <option value="SUPERVISORY">Supervisory board</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Bar (blank = shared)</label>
          <select value={bar} onChange={(e) => setBar(e.target.value as BarLocation | '')}
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
          <label className="block text-xs font-medium text-slate-600">Group photo</label>
          <div className="mt-1">
            <MediaPicker value={groupPhoto} onChange={setGroupPhoto} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Shown on the previous-boards page for this term.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Photo credit</label>
          <input value={photoCredit} onChange={(e) => setPhotoCredit(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
            placeholder="Photos by Jane Doe / Studio X" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving || !label}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {initial ? 'Save changes' : 'Create term'}
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

// ── Term card ────────────────────────────────────────────────────────────────

function TermCard({
  term,
  canEdit,
  handle,
  onUpdated,
  onDeleted,
}: {
  term: BoardTerm
  canEdit: boolean
  /** Drag handle from the surrounding SortableList; null for a viewer. */
  handle: ReactNode
  onUpdated: (t: BoardTerm) => void
  onDeleted: () => void
}) {
  const [expanded, setExpanded] = useState(term.current)
  const [editingTerm, setEditingTerm] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [members, setMembers] = useState<BoardMember[]>(term.members)
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  /** Optimistic, rolled back on failure, like the menu lists. */
  const handleReorderMembers = async (next: BoardMember[]) => {
    const previous = members
    setMembers(next.map((m, i) => ({ ...m, sortOrder: i })))
    setReorderError(null)
    try {
      await reorderBoardMembers(term.id, next.map((m) => m.id))
    } catch {
      setMembers(previous)
      setReorderError('Could not save the new order. Please try again.')
    }
  }

  const handleDeleteTerm = async () => {
    if (!confirm(`Delete term "${term.label}" and all its members?`)) return
    setDeleting(true)
    try { await deleteBoardTerm(term.id); onDeleted() }
    catch { setDeleting(false) }
  }

  if (editingTerm && canEdit) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <TermForm
          initial={term}
          onSave={async (req) => {
            const updated = await updateBoardTerm(term.id, req)
            onUpdated({ ...updated, members })
            setEditingTerm(false)
          }}
          onCancel={() => setEditingTerm(false)}
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        {handle}
        <button onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-slate-400 hover:text-slate-600">
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">{term.label}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {TYPE_LABELS[term.type]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {termScope(term)}
            </span>
            {term.current && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                Current
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {members.length} {members.length === 1 ? 'member' : 'members'}
            {term.groupPhotoUrl && ' · group photo set'}
            {term.photoCredit && ' · credit set'}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setEditingTerm(true)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={handleDeleteTerm} disabled={deleting}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-4">
          {reorderError && <p className="pt-2 text-xs text-red-600">{reorderError}</p>}
          <SortableList
            items={members}
            getId={(m) => m.id}
            labelFor={(m) => m.name}
            disabled={!canEdit}
            draggable={(m) => editingMemberId !== m.id}
            onReorder={handleReorderMembers}
          >
            {(m, handle) => (
              <MemberRow
                member={m}
                canEdit={canEdit}
                handle={handle}
                onEditingChange={(editing) => setEditingMemberId(editing ? m.id : null)}
                onUpdated={(updated) => setMembers((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                onDeleted={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}
              />
            )}
          </SortableList>

          {canEdit && (addingMember ? (
            <div className="mt-3">
              <MemberForm
                onSave={async (req) => {
                  const created = await createBoardMember(term.id, req)
                  setMembers((prev) => [...prev, created])
                  setAddingMember(false)
                }}
                onCancel={() => setAddingMember(false)}
              />
            </div>
          ) : (
            <button onClick={() => setAddingMember(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-hubble-700 hover:text-hubble-600">
              <Plus className="h-3.5 w-3.5" /> Add member
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function BoardPage() {
  const { canEditContent } = usePermissions()
  const [terms, setTerms] = useState<BoardTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBoardTerms()
      .then(setTerms)
      .catch(() => setError('Failed to load board terms'))
      .finally(() => setLoading(false))
  }, [])

  /** Optimistic, rolled back on failure, like the menu lists. */
  const handleReorderTerms = async (next: BoardTerm[]) => {
    const previous = terms
    setTerms(next.map((t, i) => ({ ...t, sortOrder: i })))
    setError(null)
    try {
      await reorderBoardTerms(next.map((t) => t.id))
    } catch {
      setTerms(previous)
      setError('Could not save the new order. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Board</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage board terms and members. The current executive board is shared across both bars;
          previous terms are per bar.
        </p>
      </div>

      {canEditContent && (
        <div className="flex justify-end">
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600">
              <Plus className="h-4 w-4" /> Add term
            </button>
          )}
        </div>
      )}

      {canEditContent && creating && (
        <TermForm
          onSave={async (req) => {
            const created = await createBoardTerm(req)
            setTerms((prev) => [...prev, { ...created, members: [] }])
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && terms.length === 0 && !creating && (
        <p className="text-sm text-slate-400">No board terms yet.</p>
      )}

      <SortableList
        items={terms}
        getId={(t) => t.id}
        labelFor={(t) => t.label}
        disabled={!canEditContent}
        onReorder={handleReorderTerms}
        className="space-y-4"
      >
        {(term, handle) => (
          <TermCard
            term={term}
            canEdit={canEditContent}
            handle={handle}
            onUpdated={(updated) => setTerms((prev) => prev.map((t) => t.id === updated.id ? updated : t))}
            onDeleted={() => setTerms((prev) => prev.filter((t) => t.id !== term.id))}
          />
        )}
      </SortableList>
    </div>
  )
}
