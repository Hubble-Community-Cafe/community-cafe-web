/**
 * Meteor's navigation, mirroring the current site's structure (simpler than
 * Hubble). Internal items route within the SPA; reservations and the food
 * tracker link out to the separate apps.
 */
export interface NavLeaf {
  label: string
  to?: string
  href?: string
}

export interface NavGroup {
  label: string
  to?: string
  /** External URL for a top-level link (e.g. Reservation). */
  href?: string
  children?: NavLeaf[]
}

export const EXTERNAL = {
  reservations: 'https://harry.hubble.cafe',
  foodTracker: 'https://food.meteor.cafe',
} as const

export const NAV: NavGroup[] = [
  { label: 'Home', to: '/' },
  { label: 'Agenda', to: '/agenda' },
  {
    label: 'Community',
    children: [
      { label: 'Current board', to: '/community/board' },
      { label: 'Previous boards', to: '/community/board/previous' },
    ],
  },
  {
    label: 'Menu',
    to: '/menu',
    children: [
      { label: 'Menu', to: '/menu' },
      { label: 'Discount Policy', to: '/menu/discount-policy' },
      { label: 'Complaints & Tips', to: '/complaints' },
      { label: 'Online Declarations', to: '/declarations' },
    ],
  },
  { label: 'Reservation', href: EXTERNAL.reservations },
]
