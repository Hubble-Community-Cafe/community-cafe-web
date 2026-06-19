import { useRole } from './RoleContext'

/** Role-derived capability flags used to gate UI and routes. */
export function usePermissions() {
  const { role } = useRole()
  const isAdmin = role === 'ADMIN'
  const isEditor = role === 'EDITOR' || isAdmin
  // DDD posters sit just above viewers: read-only everywhere, plus daily-dish edit.
  const isDddPoster = role === 'DDD_POSTER' || isEditor
  // Any signed-in staff (viewer and up) may read the content modules.
  const isViewer = role != null

  return {
    isViewer,
    isDddPoster,
    isEditor,
    isAdmin,
    // Editors manage the CMS content modules.
    canEditContent: isEditor,
    // Editors and DDD posters may edit the Daily Dinner Dish.
    canEditDailyDish: isDddPoster,
    // Admins manage users and read the audit log.
    canManageUsers: isAdmin,
    canViewAuditLog: isAdmin,
  }
}
