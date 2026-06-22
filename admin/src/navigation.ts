import {
  CalendarDays,
  Clock,
  Image,
  LayoutDashboard,
  Link,
  ScrollText,
  ShieldCheck,
  Soup,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

/**
 * What capability a nav item requires; undefined means any signed-in user.
 * Content modules are 'viewer' (everyone can read; editing is gated inside the page).
 */
export type NavRequirement = 'viewer' | 'editor' | 'admin'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  requires?: NavRequirement
  /** Marks modules not yet built, so the UI can show a "coming soon" tag. */
  placeholder?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/** Whether a signed-in user with the given capability flags may see a nav item. */
export function canSee(
  item: NavItem,
  perms: { isViewer: boolean; isEditor: boolean; isAdmin: boolean },
): boolean {
  if (item.requires === 'admin') return perms.isAdmin
  if (item.requires === 'editor') return perms.isEditor
  if (item.requires === 'viewer') return perms.isViewer
  return true
}

export const NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Menu', to: '/menu', icon: UtensilsCrossed, requires: 'viewer' },
      { label: 'Daily dish', to: '/daily-dish', icon: Soup, requires: 'viewer' },
      { label: 'Opening hours', to: '/hours', icon: Clock, requires: 'viewer' },
      { label: 'Events', to: '/events', icon: CalendarDays, requires: 'viewer' },
      { label: 'Board', to: '/board', icon: UsersRound, requires: 'viewer' },
      { label: 'Vacancies', to: '/vacancies', icon: ScrollText, requires: 'viewer' },
      { label: 'Associations', to: '/associations', icon: Link, requires: 'viewer' },
      { label: 'Media', to: '/media', icon: Image, requires: 'viewer' },
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
