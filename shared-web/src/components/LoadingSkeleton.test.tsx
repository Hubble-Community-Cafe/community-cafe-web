import '@testing-library/jest-dom/vitest'
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSkeleton } from './LoadingSkeleton'

it('tells screen readers it is loading, while its shimmer blocks stay decorative', () => {
  render(<LoadingSkeleton testId="menu-skeleton"><span aria-hidden="true" className="shimmer" /></LoadingSkeleton>)
  expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'menu-skeleton')
})
