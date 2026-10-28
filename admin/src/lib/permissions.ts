import type { AccessLevel, AdminModule, AdminUser } from './api'

/** Per-tab capability checks for a user (none when signed out or still loading). */
export function permissionsOf(user: AdminUser | null) {
  const isAdmin = user?.admin ?? false
  const level = (module: AdminModule): AccessLevel =>
    isAdmin ? 'EDIT' : (user?.permissions?.[module] ?? 'HIDDEN')

  return {
    isAdmin,
    /** May open the tab (read-only or more). */
    canView: (module: AdminModule) => level(module) !== 'HIDDEN',
    /** May change what the tab manages. */
    canEdit: (module: AdminModule) => level(module) === 'EDIT',
    // Admins manage users and read the audit log.
    canManageUsers: isAdmin,
    canViewAuditLog: isAdmin,
  }
}

export type Permissions = ReturnType<typeof permissionsOf>
