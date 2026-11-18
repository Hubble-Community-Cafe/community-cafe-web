import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConfirmActionProvider } from '../components/ConfirmActionProvider'
import { DailyDishSection } from '../pages/menu/DailyDishSection'
import { deleteDailyDish, fetchDailyDishes, updateDailyDish, type DailyDish } from '../lib/api'
import { ActionError } from '../lib/actionError'

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
    render(<ConfirmActionProvider><DailyDishSection /></ConfirmActionProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(updateDailyDish).toHaveBeenCalledWith(9, expect.objectContaining({ imageId: 7 })),
    )
  })

  /** A failed delete used to throw away silently while the dish stayed listed. */
  it('asks before deleting a dish, and says so when the delete fails', async () => {
    vi.mocked(deleteDailyDish).mockRejectedValue(new ActionError('Could not delete the daily dish. Please try again.'))
    render(<ConfirmActionProvider><DailyDishSection /></ConfirmActionProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('alertdialog', { name: 'Delete this daily dish?' }))
      .toHaveTextContent('"Lasagne" on 2026-11-20 will be removed from the website.')
    fireEvent.click(screen.getByRole('button', { name: 'Delete dish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the daily dish. Please try again.')
    expect(screen.getByText('Lasagne')).toBeInTheDocument()
  })
})
