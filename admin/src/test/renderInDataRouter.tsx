import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

/**
 * Renders like main.tsx does: a data router with one catch-all route, so hooks that need a data
 * router (useBlocker, for unsaved changes) work while the UI keeps using <Routes>.
 */
export function renderInDataRouter(ui: ReactNode, initialEntries: string[] = ['/']) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries })
  return { router, ...render(<RouterProvider router={router} />) }
}
