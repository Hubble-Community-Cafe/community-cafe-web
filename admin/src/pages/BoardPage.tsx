import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { SortableList } from '../components/SortableList'
import { usePermissions } from '../lib/usePermissions'
import { fetchBoardTerms, createBoardTerm, reorderBoardTerms, type BoardTerm } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { TermForm } from './board/TermForm'
import { TermCard } from './board/TermCard'
import { messageFor } from '../lib/actionError'

// ── Page ─────────────────────────────────────────────────────────────────────

export function BoardPage() {
  const canEditContent = usePermissions().canEdit('BOARD')
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
    } catch (err) {
      setTerms(previous)
      setError(messageFor(err, 'Could not save the new order. Please try again.'))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Board"
        description="Manage board terms and members. The current executive board is shared across both bars; previous terms are per bar."
      />

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

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {!loading && !error && terms.length === 0 && !creating && (
        <p className="text-sm text-slate-500">No board terms yet.</p>
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
