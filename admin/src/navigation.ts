import {
  CalendarDays,
  Clock,
  Image,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

/** What capability a nav item requires; undefined means any signed-in user. */
export type NavRequirement = 'editor' | 'admin'

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

export const NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Menu', to: '/menu', icon: UtensilsCrossed, requires: 'editor' },
      { label: 'Opening hours', to: '/hours', icon: Clock, requires: 'editor' },
      { label: 'Events', to: '/events', icon: CalendarDays, requires: 'editor' },
      { label: 'Board', to: '/board', icon: UsersRound, requires: 'editor' },
      { label: 'Vacancies', to: '/vacancies', icon: ScrollText, requires: 'editor', placeholder: true },
      { label: 'Media', to: '/media', icon: Image, requires: 'editor' },
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
