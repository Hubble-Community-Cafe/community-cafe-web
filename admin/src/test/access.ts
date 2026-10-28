import { noAccess, preset, type Access, type PresetName } from '../lib/access'
import type { AdminUser } from '../lib/api'
import { permissionsOf, type Permissions } from '../lib/permissions'

/** A non-admin with exactly the given levels; every other module hidden. */
export function staffUser(access: Partial<Access> = {}): AdminUser {
  return {
    id: 1, email: 'staff@hubble.cafe', displayName: 'Staff', role: 'STAFF', admin: false,
    permissions: { ...noAccess(), ...access },
  }
}

/** A user with the access of one of the old roles. */
export function presetUser(name: PresetName): AdminUser {
  return { ...staffUser(preset(name)), role: name }
}

export function adminUser(): AdminUser {
  return {
    ...staffUser(), role: 'ADMIN', admin: true,
    permissions: Object.fromEntries(Object.keys(noAccess()).map((m) => [m, 'EDIT'])) as Access,
  }
}

/** A usePermissions() result to mock with. */
export const permissionsFor = (user: AdminUser): Permissions => permissionsOf(user)
