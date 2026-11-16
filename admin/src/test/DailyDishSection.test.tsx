import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DailyDishSection } from '../pages/menu/DailyDishSection'
import { fetchDailyDishes, updateDailyDish, type DailyDish } from '../lib/api'

vi.mock('../lib/api', () => ({
  fetchDailyDishes: vi.fn(),
  createDailyDish: vi.fn(),
  updateDailyDish: vi.fn(),
  deleteDailyDish: vi.fn(),
}))
vi.mock('../lib/unsavedChanges', () => ({
  useChangedSince: () => false,
  useUnsavedChangesGuard: () => {},
}))

const lasagne: DailyDish = {
  id: 9,
  date: '2026-11-20',
  name: 'Lasagne',
  description: null,
  price: 6.5,
  imageId: 7,
  imageUrl: 'https://api.test/media/7.jpg',
}

describe('DailyDishSection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchDailyDishes).mockResolvedValue([lasagne])
    vi.mocked(updateDailyDish).mockImplementation(async (id, req) => ({ ...lasagne, ...req, id }))
  })

  /** There is no image picker, so saving must hand the dish's image back rather than clear it. */
  it('keeps the image a dish already has when it is edited', async () => {
    render(<DailyDishSection />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(updateDailyDish).toHaveBeenCalledWith(9, expect.objectContaining({ imageId: 7 })),
    )
  })
})
