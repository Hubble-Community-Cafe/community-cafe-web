import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ItemForm } from '../pages/menu/ItemForm'
import type { MenuItem } from '../lib/api'

const coffee: MenuItem = {
  id: 1,
  categoryId: 2,
  name: 'Coffee',
  description: null,
  regularPrice: 3.35,
  studentPrice: 2.3,
  sizeOptions: [],
  dietaryTags: [],
  allergens: [],
  imageUrl: null,
  sortOrder: 4,
  active: true,
}

function renderForm(initial?: MenuItem) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  render(<ItemForm initial={initial} onSave={onSave} onCancel={vi.fn()} />)
  return onSave
}

describe('ItemForm', () => {
  /** Position is dragged, not typed, and an edit must not drop the item to the bottom. */
  it('leaves the position out of the payload', async () => {
    const onSave = renderForm(coffee)
    expect(screen.queryByLabelText(/sort order/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('sortOrder')
  })

  it('keeps the prices it was given', async () => {
    const onSave = renderForm(coffee)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ regularPrice: 3.35, studentPrice: 2.3 }),
      ),
    )
  })

  it('treats a blank student price as no student price', async () => {
    const onSave = renderForm(coffee)
    fireEvent.change(screen.getByLabelText(/student price/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ studentPrice: null })),
    )
  })
})
