import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CategoryForm } from '../pages/menu/CategoryForm'
import type { MenuCategory } from '../lib/api'

const hiddenTab: MenuCategory = {
  id: 1,
  name: 'Drinks',
  kind: 'DRINK',
  availabilityNote: null,
  sortOrder: 1,
  bar: 'HUBBLE',
  parentId: null,
  active: false,
}

function renderForm(initial?: MenuCategory, onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <CategoryForm
      initial={initial}
      defaultBar="HUBBLE"
      onSave={onSave}
      onCancel={vi.fn()}
    />,
  )
  return onSave
}

describe('CategoryForm', () => {
  it('keeps a hidden category hidden when other fields are edited', async () => {
    const onSave = renderForm(hiddenTab)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ active: false })),
    )
  })

  it('creates new categories visible by default', async () => {
    const onSave = renderForm()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Snacks' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ active: true })),
    )
  })

  /** Position is dragged, not typed, and an edit must not move the category. */
  it('leaves the position out of the payload', async () => {
    const onSave = renderForm(hiddenTab)
    expect(screen.queryByLabelText(/sort order/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('sortOrder')
  })

  it('offers only the two bars, not a shared option', () => {
    renderForm()
    const options = screen
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value)
    expect(options).toContain('HUBBLE')
    expect(options).toContain('METEOR')
    expect(options).not.toContain('SHARED')
  })
})
