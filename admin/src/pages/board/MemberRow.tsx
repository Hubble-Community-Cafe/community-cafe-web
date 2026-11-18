import { type ReactNode, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { updateBoardMember, deleteBoardMember, type BoardMember } from '../../lib/api'
import { MemberForm } from './MemberForm'
import { useConfirmAction } from '../../lib/confirmAction'

export function MemberRow({
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
  const confirmAction = useConfirmAction()

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
          <button onClick={() => setEditingState(true)} aria-label={`Edit ${member.name}`}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => confirmAction({
            title: 'Remove this board member?',
            message: `"${member.name}" will be removed from this board term.`,
            confirmLabel: 'Remove member',
            busyLabel: 'Removing…',
            action: async () => {
              await deleteBoardMember(member.id)
              onDeleted()
            },
          })} aria-label={`Remove ${member.name}`}
            className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Term form ────────────────────────────────────────────────────────────────
