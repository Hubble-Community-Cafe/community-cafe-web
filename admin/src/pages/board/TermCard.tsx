import { type ReactNode, useState } from 'react'
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react'
import { SortableList } from '../../components/SortableList'
import {
  updateBoardTerm,
  deleteBoardTerm,
  createBoardMember,
  reorderBoardMembers,
  type BoardTerm,
  type BoardMember,
} from '../../lib/api'
import { TYPE_LABELS, termScope } from './labels'
import { MemberForm } from './MemberForm'
import { MemberRow } from './MemberRow'
import { TermForm } from './TermForm'
import { useConfirmAction } from '../../lib/confirmAction'

export function TermCard({
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
  const confirmAction = useConfirmAction()
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

  const handleDeleteTerm = () => confirmAction({
    title: 'Delete this board term?',
    message: `"${term.label}" and all its members will be removed. This cannot be undone.`,
    confirmLabel: 'Delete term',
    action: async () => {
      await deleteBoardTerm(term.id)
      onDeleted()
    },
  })

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
        <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}
          aria-label={`${expanded ? 'Hide' : 'Show'} members of ${term.label}`}
          className="shrink-0 text-slate-500 hover:text-slate-700">
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
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {termScope(term)}
            </span>
            {term.current && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                Current
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {members.length} {members.length === 1 ? 'member' : 'members'}
            {term.groupPhotoUrl && ' · group photo set'}
            {term.photoCredit && ' · credit set'}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setEditingTerm(true)} aria-label={`Edit ${term.label}`}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={handleDeleteTerm} aria-label={`Delete ${term.label}`}
              className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
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
