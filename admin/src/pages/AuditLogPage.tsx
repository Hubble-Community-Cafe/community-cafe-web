import { useCallback, useEffect, useState } from 'react'
import { Card, PageHeader } from '../components/PageHeader'
import { fetchAuditLog, type AuditLogEntry } from '../lib/api'

/** Filter options mirror the backend AuditEntityType / AuditAction enums. */
const ENTITY_TYPES = [
  'ADMIN_USER', 'MEDIA_ASSET', 'MENU_CATEGORY', 'MENU_ITEM', 'DAILY_DISH',
  'OPENING_HOURS', 'HOURS_OVERRIDE', 'EVENT', 'BOARD_TERM', 'BOARD_MEMBER',
  'VACANCY', 'ASSOCIATION',
]
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGED', 'TOGGLE']

/** ADMIN_USER -> "Admin user" for the dropdown labels. */
const humanize = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')

  const load = useCallback(async (p: number, et: string, ac: string) => {
    setIsLoading(true)
    try {
      const result = await fetchAuditLog(p, 50, {
        entityType: et || undefined,
        action: ac || undefined,
      })
      setEntries(result.content)
      setTotalPages(result.totalPages)
      setError(null)
    } catch {
      setError('Failed to load the audit log.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page, entityType, action)
  }, [load, page, entityType, action])

  return (
    <>
      <PageHeader title="Audit log" description="Every change made through the admin, newest first." />
      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Entity
            <select
              aria-label="Filter by entity"
              value={entityType}
              onChange={(e) => {
                setPage(0)
                setEntityType(e.target.value)
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case text-slate-700"
            >
              <option value="">All entities</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Action
            <select
              aria-label="Filter by action"
              value={action}
              onChange={(e) => {
                setPage(0)
                setAction(e.target.value)
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case text-slate-700"
            >
              <option value="">All actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {humanize(a)}
                </option>
              ))}
            </select>
          </label>
          {(entityType || action) && (
            <button
              type="button"
              onClick={() => {
                setPage(0)
                setEntityType('')
                setAction('')
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            {entityType || action ? 'No entries match these filters.' : 'No audit entries yet.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4 font-semibold">When</th>
                    <th className="py-2 pr-4 font-semibold">Who</th>
                    <th className="py-2 pr-4 font-semibold">Action</th>
                    <th className="py-2 pr-4 font-semibold">Entity</th>
                    <th className="py-2 font-semibold">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap text-slate-500">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{e.actorName || e.actorEmail || '–'}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {e.action}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {e.entityType}
                        {e.entityLabel ? `: ${e.entityLabel}` : ''}
                      </td>
                      <td className="py-3 text-slate-600">{e.summary || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  )
}
