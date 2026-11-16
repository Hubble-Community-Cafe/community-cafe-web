import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConfirmActionProvider } from '../components/ConfirmActionProvider'
import { useConfirmAction, type ConfirmActionOptions } from '../lib/confirmAction'
import { ActionError } from '../lib/actionError'

/** A button that asks before running `action`, and shows what the ask resolved to. */
function Asker({ options }: { options: Omit<ConfirmActionOptions, 'title' | 'message' | 'confirmLabel'> }) {
  const confirmAction = useConfirmAction()
  return (
    <button onClick={async () => {
      const done = await confirmAction({
        title: 'Delete this event?', message: '"Quiz" will be removed from the website.',
        confirmLabel: 'Delete event', ...options,
      })
      document.body.dataset.result = String(done)
    }}>Delete</button>
  )
}

const renderAsker = (action: () => Promise<void>) =>
  render(<ConfirmActionProvider><Asker options={{ action }} /></ConfirmActionProvider>)

describe('ConfirmActionProvider', () => {
  it('asks first, says what will happen, and starts on Cancel', async () => {
    const action = vi.fn()
    renderAsker(action)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this event?' })
    expect(dialog).toHaveTextContent('"Quiz" will be removed from the website.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(action).not.toHaveBeenCalled()
  })

  it('does nothing when cancelled', async () => {
    const action = vi.fn()
    renderAsker(action)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(action).not.toHaveBeenCalled()
    expect(document.body.dataset.result).toBe('false')
  })

  it('runs the action once confirmed, shows it is busy, and closes when it is done', async () => {
    let finish: () => void = () => {}
    renderAsker(() => new Promise<void>((resolve) => { finish = resolve }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete event' }))

    expect(await screen.findByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    // Escape must not walk away from a delete that is still running.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    await act(async () => finish())
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(document.body.dataset.result).toBe('true')
  })

  it("keeps the dialog open on failure with the backend's reason, and can try again", async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(new ActionError("This image is still used by the event 'Pub quiz'."))
      .mockResolvedValueOnce(undefined)
    renderAsker(action)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete event' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("This image is still used by the event 'Pub quiz'.")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('shows a plain message, not a technical one, for any other failure', async () => {
    renderAsker(() => Promise.reject(new TypeError('Failed to fetch')))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete event' }))

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('That did not work. Please check your connection and try again.')
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('Failed to fetch')
  })
})
