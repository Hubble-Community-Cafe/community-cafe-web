import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BulkActionBar } from '../pages/menu/BulkActionBar'
import type { MenuCategory, MenuItem } from '../lib/api'

function item(id: number, name: string): MenuItem {
  return {
    id, categoryId: 1, name, description: null, regularPrice: 7, studentPrice: 6,
    sizeOptions: [], dietaryTags: [], allergens: [], imageUrl: null, sortOrder: id, active: true,
  }
}

function category(id: number, name: string): MenuCategory {
  return { id, name, kind: 'DRINK', availabilityNote: null, sortOrder: id, bar: 'HUBBLE', parentId: 9, active: true }
}

const selected = [item(1, 'Mojito'), item(2, 'Negroni'), item(3, 'Daiquiri'), item(4, 'Gin Tonic')]
const targets = [{ tabName: 'Drinks', categories: [category(5, 'Beers'), category(6, 'Shots')] }]

function renderBar(overrides: Partial<Parameters<typeof BulkActionBar>[0]> = {}) {
  const onSetPrice = vi.fn().mockResolvedValue(undefined)
  const onMove = vi.fn().mockResolvedValue(undefined)
  const onClear = vi.fn()
  render(
    <BulkActionBar
      selected={selected}
      moveTargets={targets}
      onSetPrice={onSetPrice}
      onMove={onMove}
      onClear={onClear}
      {...overrides}
    />,
  )
  return { onSetPrice, onMove, onClear }
}

const openPricePanel = () => fireEvent.click(screen.getByRole('button', { name: /set price/i }))

describe('BulkActionBar', () => {
  it('counts the selection', () => {
    renderBar()
    expect(screen.getByText('4 items selected')).toBeInTheDocument()
  })

  it('uses the singular for one item', () => {
    renderBar({ selected: [item(1, 'Mojito')] })
    expect(screen.getByText('1 item selected')).toBeInTheDocument()
  })

  /** The editor should see which rows a price will land on before pressing Apply. */
  it('names the items it will change without listing all of them', () => {
    renderBar()
    expect(screen.getAllByText(/Mojito, Negroni and 2 more/).length).toBeGreaterThan(0)
  })

  it('writes nothing until Apply is pressed', () => {
    const { onSetPrice } = renderBar()
    openPricePanel()
    fireEvent.change(screen.getByLabelText(/regular price/i), { target: { value: '7.50' } })
    expect(onSetPrice).not.toHaveBeenCalled()
  })

  it('sends only the regular price when the student price is left blank', async () => {
    const { onSetPrice } = renderBar()
    openPricePanel()
    fireEvent.change(screen.getByLabelText(/regular price/i), { target: { value: '7.50' } })
    fireEvent.click(screen.getByRole('button', { name: /apply to 4 items/i }))
    await waitFor(() =>
      expect(onSetPrice).toHaveBeenCalledWith({
        regularPrice: 7.5, studentPrice: null, clearStudentPrice: false,
      }),
    )
  })

  it('asks to clear the student price rather than sending a blank one', async () => {
    const { onSetPrice } = renderBar()
    openPricePanel()
    fireEvent.click(screen.getByLabelText(/remove the tu\/e student price/i))
    fireEvent.click(screen.getByRole('button', { name: /apply to 4 items/i }))
    await waitFor(() =>
      expect(onSetPrice).toHaveBeenCalledWith({
        regularPrice: null, studentPrice: null, clearStudentPrice: true,
      }),
    )
  })

  /** The backend rejects both together, so the form must not let them be sent. */
  it('disables the student price field once removal is ticked', () => {
    renderBar()
    openPricePanel()
    fireEvent.click(screen.getByLabelText(/remove the tu\/e student price/i))
    expect(screen.getByLabelText(/TU\/e student price \(€\)/i)).toBeDisabled()
  })

  it('refuses an empty price form instead of calling the API', async () => {
    const { onSetPrice } = renderBar()
    openPricePanel()
    fireEvent.click(screen.getByRole('button', { name: /apply to 4 items/i }))
    await screen.findByText(/enter a price/i)
    expect(onSetPrice).not.toHaveBeenCalled()
  })

  it('reports a failed price update and keeps the panel open', async () => {
    const onSetPrice = vi.fn().mockRejectedValue(new Error('boom'))
    renderBar({ onSetPrice })
    openPricePanel()
    fireEvent.change(screen.getByLabelText(/regular price/i), { target: { value: '7.50' } })
    fireEvent.click(screen.getByRole('button', { name: /apply to 4 items/i }))
    await screen.findByText(/could not update those prices/i)
    expect(screen.getByLabelText(/regular price/i)).toBeInTheDocument()
  })

  it('moves the selection to the chosen sub-category', async () => {
    const { onMove } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /move to/i }))
    fireEvent.change(screen.getByLabelText(/move to sub-category/i), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: /move 4 items/i }))
    await waitFor(() => expect(onMove).toHaveBeenCalledWith(6))
  })

  it('refuses to move without a destination', async () => {
    const { onMove } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /move to/i }))
    fireEvent.click(screen.getByRole('button', { name: /move 4 items/i }))
    await screen.findByText(/choose a sub-category/i)
    expect(onMove).not.toHaveBeenCalled()
  })

  it('offers no move when there is nowhere else to put them', () => {
    renderBar({ moveTargets: [] })
    expect(screen.getByRole('button', { name: /move to/i })).toBeDisabled()
  })

  it('clears the selection', () => {
    const { onClear } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(onClear).toHaveBeenCalled()
  })
})
