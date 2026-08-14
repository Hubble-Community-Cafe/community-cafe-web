import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { VisibilityToggle } from '../components/VisibilityToggle'

describe('VisibilityToggle', () => {
  it('offers to hide something that is currently visible', () => {
    render(<VisibilityToggle active label="Beers" onToggle={vi.fn().mockResolvedValue({})} />)
    const button = screen.getByRole('button', { name: 'Hide Beers from the site' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('offers to show something that is currently hidden', () => {
    render(<VisibilityToggle active={false} label="Beers" onToggle={vi.fn().mockResolvedValue({})} />)
    const button = screen.getByRole('button', { name: 'Show Beers on the site' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('requests the opposite of the current state', async () => {
    const onToggle = vi.fn().mockResolvedValue({})
    render(<VisibilityToggle active label="Beers" onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(false))
  })

  it('does not fire twice while a request is in flight', async () => {
    let resolve: (v: unknown) => void = () => {}
    const onToggle = vi.fn(() => new Promise((r) => { resolve = r }))
    render(<VisibilityToggle active label="Beers" onToggle={onToggle} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledTimes(1)
    resolve({})
    await waitFor(() => expect(button).not.toBeDisabled())
  })
})
