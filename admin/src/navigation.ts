import {
  CalendarDays,
  Clock,
  Image,
  LayoutDashboard,
  Link,
  MonitorPlay,
  ScrollText,
  ShieldCheck,
  Soup,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { AdminModule } from './lib/api'
import type { Permissions } from './lib/permissions'

/**
 * What a nav item (and its route) requires: 'admin', or view access on any of the listed
 * modules. Undefined means any signed-in user. Editing is gated inside each page.
 */
export type NavRequirement = 'admin' | AdminModule[]

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  requires?: NavRequirement
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/** Whether a signed-in user with the given permissions meets a requirement. */
export function canAccess(
  requires: NavRequirement | undefined,
  perms: Pick<Permissions, 'isAdmin' | 'canView'>,
): boolean {
  if (requires === undefined) return true
  if (requires === 'admin') return perms.isAdmin
  return requires.some((module) => perms.canView(module))
}

/** Whether a signed-in user with the given permissions may see a nav item. */
export function canSee(item: NavItem, perms: Pick<Permissions, 'isAdmin' | 'canView'>): boolean {
  return canAccess(item.requires, perms)
}

export const NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Menu', to: '/menu', icon: UtensilsCrossed, requires: ['MENU'] },
      { label: 'Daily dish', to: '/daily-dish', icon: Soup, requires: ['DAILY_DISH'] },
      { label: 'Opening hours', to: '/hours', icon: Clock, requires: ['OPENING_HOURS'] },
      { label: 'Events', to: '/events', icon: CalendarDays, requires: ['EVENTS'] },
      { label: 'Board', to: '/board', icon: UsersRound, requires: ['BOARD'] },
      { label: 'Vacancies', to: '/vacancies', icon: ScrollText, requires: ['VACANCIES'] },
      { label: 'Associations', to: '/associations', icon: Link, requires: ['ASSOCIATIONS'] },
      { label: 'Media', to: '/media', icon: Image, requires: ['MEDIA'] },
    ],
  },
  {
    title: 'Bar',
    items: [
      // Screen posters on its own also opens the tab, to pick the posters there.
      { label: 'Screens', to: '/screens', icon: MonitorPlay, requires: ['SCREENS', 'SCREEN_POSTERS'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: ShieldCheck, requires: 'admin' },
      { label: 'Audit log', to: '/audit', icon: ScrollText, requires: 'admin' },
    ],
  },
]
