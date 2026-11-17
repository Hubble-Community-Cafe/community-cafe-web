import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { expectLoadingSkeleton } from '@cafe/shared-web/testing/forms'
import { MemoryRouter } from 'react-router-dom'
import { DailyDishPage } from '../pages/DailyDishPage'
import { getTodaysDishes, reportApiFailure, type DailyDish } from '@cafe/shared-web'

vi.mock('@cafe/shared-web', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cafe/shared-web')>()
  return { ...actual, getTodaysDishes: vi.fn(), reportApiFailure: vi.fn() }
})

const mockGetDishes = vi.mocked(getTodaysDishes)
const mockReport = vi.mocked(reportApiFailure)

const DISH: DailyDish[] = [
  { id: 1, date: '2026-06-24', name: 'Pasta Pesto', description: 'With pine nuts', price: 9.5, imageUrl: null },
]

function renderDish() {
  return render(
    <MemoryRouter>
      <DailyDishPage />
    </MemoryRouter>,
  )
}

describe('Hubble DailyDishPage', () => {
  beforeEach(() => {
    mockGetDishes.mockReset()
    mockReport.mockReset()
  })

  it('shows a skeleton while loading', async () => {
    mockGetDishes.mockResolvedValue(DISH)
    renderDish()
    expectLoadingSkeleton('dish-skeleton')
    await screen.findByText('Pasta Pesto')
  })

  it('renders the spotlight card with a Today tag', async () => {
    mockGetDishes.mockResolvedValue(DISH)
    renderDish()
    expect(await screen.findByText('Pasta Pesto')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByTestId('dish-skeleton')).not.toBeInTheDocument()
  })

  it('colours the card with the theme tokens, not copied hex values', async () => {
    mockGetDishes.mockResolvedValue(DISH)
    renderDish()
    const card = (await screen.findByText('Pasta Pesto')).closest('.rounded-2xl') as HTMLElement
    expect(card).toHaveClass('from-hubble-700', 'to-hubble-600')
    expect(card.getAttribute('style')).toBeNull()
  })

  it('shows an error and reports it when loading fails', async () => {
    mockGetDishes.mockRejectedValue(new Error('down'))
    renderDish()
    expect(await screen.findByRole('alert')).toHaveTextContent("Could not load today's dish. Try again later.")
    expect(mockReport).toHaveBeenCalledWith('daily-dish', expect.any(Error))
  })
})
