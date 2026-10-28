import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Card, PageHeader } from '../components/PageHeader'
import { fetchAllUsers, updateUserAccess, type AdminUser } from '../lib/api'
import { accessSummary, type Access } from '../lib/access'
import { useRole } from '../lib/RoleContext'
import { AccessForm } from './users/AccessForm'

export function UsersPage() {
  const { user: currentUser } = useRole()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setUsers(await fetchAllUsers())
      setError(null)
    } catch {
      setError('Failed to load users.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveAccess = async (id: number, access: { admin: boolean; permissions: Access }) => {
    const updated = await updateUserAccess(id, access)
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    setEditingId(null)
  }

  return (
    <>
      <PageHeader title="Users" description="Staff and board members, and which tabs each of them may see or edit." />
      <Card>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">No users yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id
              return (
                <li key={u.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {/* On a phone the name takes its own line; summary and button go below it. */}
                    <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{u.displayName || '–'}</p>
                      <p className="truncate text-sm text-slate-600">{u.email}</p>
                    </div>
                    <p className="mr-auto flex items-center gap-1.5 text-sm text-slate-600 sm:mr-0">
                      {u.admin && <ShieldCheck className="h-4 w-4 text-hubble-700" aria-hidden />}
                      {accessSummary(u.admin, u.permissions)}
                    </p>
                    {isSelf ? (
                      <span className="text-xs text-slate-500">(you, ask another admin to change this)</span>
                    ) : editingId !== u.id && (
                      <button type="button" onClick={() => setEditingId(u.id)}
                        aria-label={`Change access for ${u.displayName || u.email}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        Change access
                      </button>
                    )}
                  </div>
                  {editingId === u.id && (
                    <AccessForm user={u} onSave={(access) => saveAccess(u.id, access)}
                      onCancel={() => setEditingId(null)} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
