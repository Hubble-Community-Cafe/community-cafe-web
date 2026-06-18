import { useRole } from './RoleContext'

/** Role-derived capability flags used to gate UI and routes. */
export function usePermissions() {
  const { role } = useRole()
  const isEditor = role === 'EDITOR' || role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  return {
    isEditor,
    isAdmin,
    // Editors manage the CMS content modules.
    canEditContent: isEditor,
    // Admins manage users and read the audit log.
    canManageUsers: isAdmin,
    canViewAuditLog: isAdmin,
  }
}
