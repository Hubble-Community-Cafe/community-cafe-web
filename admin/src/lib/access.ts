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

export const PRESET_LABELS: Record<PresetName, string> = {
  VIEWER: 'Viewer',
  DDD_POSTER: 'DDD poster',
  EDITOR: 'Editor',
}

/** One line per tab explaining what the levels mean, for non-technical admins. */
export const MODULE_HINTS: Record<AdminModule, string> = {
  MENU: 'The drinks and food menus of both bars.',
  DAILY_DISH: 'The daily dinner dish at Hubble.',
  OPENING_HOURS: 'Weekly opening hours and special dates.',
  EVENTS: 'Events at both bars.',
  BOARD: 'Current, previous and supervisory boards. Edit includes uploading their photos.',
  VACANCIES: 'Open positions. Edit includes uploading their images.',
  ASSOCIATIONS: 'Associations and their logos. Edit includes uploading logos.',
  MEDIA: 'The image library. Edit includes deleting images.',
  SCREENS: 'View shows what the screens show; Edit switches them between open, last call and closed.',
  SCREEN_POSTERS: 'Which slide the closed and last call scenes show.',
}

/** Tabs that are only on or off: there is nothing to look at without changing it. */
export const ON_OFF_MODULES: AdminModule[] = ['SCREEN_POSTERS']

/** A short summary of someone's access, for the users list. */
export function accessSummary(admin: boolean, access: Access): string {
  if (admin) return 'Admin: full access'
  const edits = MODULES.filter((m) => access[m] === 'EDIT').length
  const views = MODULES.filter((m) => access[m] === 'VIEW').length
  if (edits === 0 && views === 0) return 'No access yet'
  const tabs = (n: number) => `${n} ${n === 1 ? 'tab' : 'tabs'}`
  const parts: string[] = []
  if (edits > 0) parts.push(`edits ${tabs(edits)}`)
  if (views > 0) parts.push(`views ${tabs(views)}`)
  const summary = parts.join(', ')
  return summary.charAt(0).toUpperCase() + summary.slice(1)
}
