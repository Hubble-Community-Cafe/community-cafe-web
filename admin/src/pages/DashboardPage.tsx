import { Card, PageHeader } from '../components/PageHeader'
import { useRole } from '../lib/RoleContext'
import { usePermissions } from '../lib/usePermissions'
import type { AdminRole } from '../lib/api'

const ROLE_LABELS: Record<AdminRole, string> = {
  VIEWER: 'Viewer',
  DDD_POSTER: 'DDD poster',
  EDITOR: 'Editor',
  ADMIN: 'Admin',
}

export function DashboardPage() {
  const { user, role, isLoading } = useRole()
  const { isEditor, isAdmin, isDddPoster } = usePermissions()

  return (
    <>
      <PageHeader
        title={`Welcome${user?.displayName ? `, ${user.displayName}` : ''}`}
        description="The shared admin for Hubble and Meteor. Manage content once; it publishes to the right site."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your role</p>
          <p className="mt-2 font-title text-2xl font-bold text-slate-800">
            {isLoading ? '…' : (role ? ROLE_LABELS[role] : 'Unknown')}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Full access, including users and the audit log.'
              : isEditor
                ? 'You can edit the content modules.'
                : isDddPoster
                  ? 'You can view all content and edit the Daily Dinner Dish.'
                  : 'Read-only access. Ask an admin for edit rights.'}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Content</p>
          <p className="mt-2 text-sm text-slate-600">
            Menu, opening hours, events, board, and vacancies for both cafes. Modules light up as
            they ship.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sites</p>
          <p className="mt-2 text-sm text-slate-600">
            <a className="text-hubble-600 hover:underline" href="https://test.hubble.cafe">
              test.hubble.cafe
            </a>
            {' · '}
            <a className="text-hubble-600 hover:underline" href="https://test.meteor.cafe">
              test.meteor.cafe
            </a>
          </p>
        </Card>
      </div>
    </>
  )
}
