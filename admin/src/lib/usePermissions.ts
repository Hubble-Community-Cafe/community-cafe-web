import { useRole } from './RoleContext'
import { permissionsOf, type Permissions } from './permissions'

export type { Permissions } from './permissions'

/** The signed-in user's per-tab capabilities, used to gate the UI and routes. */
export function usePermissions(): Permissions {
  return permissionsOf(useRole().user)
}
