import type { AccessLevel, AdminModule } from './api'

/** Every module, in the order the admin lists them. */
export const MODULES: AdminModule[] = [
  'MENU', 'DAILY_DISH', 'OPENING_HOURS', 'EVENTS', 'BOARD', 'VACANCIES',
  'ASSOCIATIONS', 'MEDIA', 'SCREENS', 'SCREEN_POSTERS',
]

export const MODULE_LABELS: Record<AdminModule, string> = {
  MENU: 'Menu',
  DAILY_DISH: 'Daily dish',
  OPENING_HOURS: 'Opening hours',
  EVENTS: 'Events',
  BOARD: 'Board',
  VACANCIES: 'Vacancies',
  ASSOCIATIONS: 'Associations',
  MEDIA: 'Media',
  SCREENS: 'Screens',
  SCREEN_POSTERS: 'Screen posters',
}

export type Access = Record<AdminModule, AccessLevel>

/** Every module hidden: what a new account starts with. */
export function noAccess(): Access {
  return Object.fromEntries(MODULES.map((m) => [m, 'HIDDEN'])) as Access
}

const CONTENT: AdminModule[] = [
  'MENU', 'DAILY_DISH', 'OPENING_HOURS', 'EVENTS', 'BOARD', 'VACANCIES', 'ASSOCIATIONS', 'MEDIA',
]

export type PresetName = 'VIEWER' | 'DDD_POSTER' | 'EDITOR'

/** The access of the old roles. Must match the backend's AccessPresets. */
export function preset(name: PresetName): Access {
  const access = noAccess()
  for (const m of CONTENT) access[m] = name === 'EDITOR' ? 'EDIT' : 'VIEW'
  if (name === 'DDD_POSTER') access.DAILY_DISH = 'EDIT'
  access.SCREENS = 'EDIT'
  if (name === 'EDITOR') access.SCREEN_POSTERS = 'EDIT'
  return access
}
