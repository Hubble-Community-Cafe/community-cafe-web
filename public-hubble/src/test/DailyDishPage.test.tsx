import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByTestId('dish-skeleton')).toBeInTheDocument()
    await screen.findByText('Pasta Pesto')
  })

  it('renders the spotlight card with a Today tag', async () => {
    mockGetDishes.mockResolvedValue(DISH)
    renderDish()
    expect(await screen.findByText('Pasta Pesto')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByTestId('dish-skeleton')).not.toBeInTheDocument()
  })

  it('shows an error and reports it when loading fails', async () => {
    mockGetDishes.mockRejectedValue(new Error('down'))
    renderDish()
    expect(await screen.findByText("Could not load today's dish. Try again later.")).toBeInTheDocument()
    expect(mockReport).toHaveBeenCalledWith('daily-dish', expect.any(Error))
  })
})
