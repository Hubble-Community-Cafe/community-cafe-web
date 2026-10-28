import { useId, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { FieldChange } from '../../lib/auditChanges'

/** A value, or a visible marker when the field was empty. */
function Value({ value, removed }: { value: string | null; removed?: boolean }) {
  if (value === null) return <span className="italic text-slate-400">empty</span>
  return removed
    ? <del className="break-words text-slate-500">{value}</del>
    : <ins className="break-words font-medium text-slate-800 no-underline">{value}</ins>
}

/**
 * The field-level detail of an audit entry behind a "Show changes" toggle: old to new for an
 * edit, the values set for something added, the last values of something deleted.
 */
export function AuditChanges({ changes, action }: { changes: FieldChange[]; action: string }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (changes.length === 0) return null

  const label = action === 'CREATE' ? 'Show values' : action === 'DELETE' ? 'Show last values' : 'Show changes'
  return (
    <div className="mt-1">
      <button type="button" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-hubble-700 hover:underline">
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {open ? 'Hide' : label} ({changes.length})
      </button>
      {open && (
        <dl id={listId} className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2 text-xs">
          {changes.map((c, i) => (
            <div key={`${c.field}-${i}`} className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-slate-600">{c.field}:</dt>
              <dd className="flex flex-wrap items-baseline gap-x-1.5">
                {action === 'CREATE' ? (
                  <Value value={c.newValue} />
                ) : action === 'DELETE' ? (
                  <Value value={c.oldValue} removed />
                ) : (
                  <>
                    <Value value={c.oldValue} removed={c.oldValue !== null} />
                    <span aria-hidden className="text-slate-400">→</span>
                    <span className="sr-only">changed to</span>
                    <Value value={c.newValue} />
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
