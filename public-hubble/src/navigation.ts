/**
 * Hubble's navigation, mirroring the current site's structure.
 * Internal items route within the SPA; external items link out (reservations
 * via harry.hubble.cafe and the food tracker stay separate apps).
 *
 * Routed pages that aren't built yet render a placeholder shell; CMS-driven
 * modules (menu, daily dish, events, board, vacancies) fill in over later steps.
 */
export interface NavLeaf {
  label: string
  /** Internal SPA route. */
  to?: string
  /** External URL (opens in a new tab). */
  href?: string
}

export interface NavGroup {
  label: string
  /** A group may also be directly navigable (e.g. Cafe overview). */
  to?: string
  children?: NavLeaf[]
}

export const EXTERNAL = {
  reservations: 'https://harry.hubble.cafe',
  foodTracker: 'https://food.hubble.cafe',
} as const

export const NAV: NavGroup[] = [
  {
    label: 'Community',
    children: [
      { label: 'Associations', to: '/community/associations' },
      { label: 'Committees', to: '/community/committees' },
      { label: 'Board', to: '/community/board' },
      { label: 'Previous boards', to: '/community/board/previous' },
      { label: 'Supervisory Board', to: '/community/board/supervisory' },
    ],
  },
  {
    label: 'Cafe',
    to: '/cafe',
    children: [
      { label: 'Make a reservation', href: EXTERNAL.reservations },
      { label: 'Daily Dinner Dish', to: '/cafe/daily-dish' },
      { label: 'Menu', to: '/cafe/menu' },
      { label: 'Order tracker', href: EXTERNAL.foodTracker },
      { label: 'Discount policy', to: '/cafe/discount-policy' },
      { label: 'Vacancies', to: '/vacancies' },
    ],
  },
  {
    label: 'Contact',
    to: '/contact',
    children: [
      { label: 'Make a reservation', href: EXTERNAL.reservations },
      { label: 'Tips, Complaints and Ideas', to: '/contact/tips' },
      { label: 'Information form', to: '/contact/information' },
      { label: 'Online Declarations', to: '/contact/declarations' },
      { label: 'Hubble Screens', to: '/contact/screens' },
      { label: 'Loan Equipment', to: '/contact/loan-equipment' },
    ],
  },
]
