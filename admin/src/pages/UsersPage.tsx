import { useCallback, useEffect, useState } from 'react'
import { Card, PageHeader } from '../components/PageHeader'
import { fetchAllUsers, updateUserRole, type AdminRole, type AdminUser } from '../lib/api'
import { useRole } from '../lib/RoleContext'

const ROLES: AdminRole[] = ['VIEWER', 'DDD_POSTER', 'EDITOR', 'ADMIN']

const ROLE_LABELS: Record<AdminRole, string> = {
  VIEWER: 'Viewer',
  DDD_POSTER: 'DDD poster',
  EDITOR: 'Editor',
  ADMIN: 'Admin',
}

export function UsersPage() {
  const { user: currentUser } = useRole()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

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

  const changeRole = async (id: number, role: AdminRole) => {
    setSavingId(id)
    setError(null)
    try {
      const updated = await updateUserRole(id, role)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch {
      setError('Could not change that role. You cannot change your own role.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Staff and board members, and their access level." />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Email</th>
                  <th className="py-2 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  return (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-800">{u.displayName || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                      <td className="py-3">
                        <select
                          aria-label={`Role for ${u.email}`}
                          value={u.role}
                          disabled={isSelf || savingId === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value as AdminRole)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
