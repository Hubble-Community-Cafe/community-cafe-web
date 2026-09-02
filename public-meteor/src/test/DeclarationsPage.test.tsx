import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DeclarationsPage } from '../pages/DeclarationsPage'

// The widget registers web workers and auto-fetches on mount; the page only needs its callback.
vi.mock('altcha', () => ({}))

const submitDeclarationForm = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitDeclarationForm,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <DeclarationsPage />
    </MemoryRouter>,
  )
}

/** Fill the required text fields so only the receipt decides whether the form submits. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name *'), 'Nora Vermeer')
  await user.type(screen.getByLabelText('Email address *'), 'nora@example.com')
  await user.type(screen.getByLabelText('IBAN *'), 'NL70 TRIO 0338 5890 15')
  await user.type(screen.getByLabelText('Amount in euros *'), '40,00')
}

function file(name: string, type: string, bytes = 3) {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('Meteor DeclarationsPage', () => {
  beforeEach(() => {
    submitDeclarationForm.mockReset()
    submitDeclarationForm.mockResolvedValue(undefined)
  })

  it('routes the declaration to Meteor rather than Hubble', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await user.upload(screen.getByLabelText('Receipt *'), file('receipt.pdf', 'application/pdf'))

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(submitDeclarationForm).toHaveBeenCalledTimes(1)
    const data = submitDeclarationForm.mock.calls[0][0] as FormData
    expect(data.get('bar')).toBe('METEOR')
    expect(data.get('fullName')).toBe('Nora Vermeer')
    expect(await screen.findByRole('heading', { name: 'Declaration submitted' })).toBeInTheDocument()
  })

  it('rejects a receipt of an unsupported type before sending', async () => {
    // The `accept` attribute is only a hint the file picker may ignore, so the guard has to
    // hold on its own; applyAccept: false is what lets the test reach it.
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await fillRequiredFields(user)
    await user.upload(screen.getByLabelText('Receipt *'), file('notes.txt', 'text/plain'))

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/unsupported file type/i)
    expect(submitDeclarationForm).not.toHaveBeenCalled()
  })

  it('rejects a receipt over 10 MB before sending', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    const tooBig = file('receipt.pdf', 'application/pdf', 10 * 1024 * 1024 + 1)
    await user.upload(screen.getByLabelText('Receipt *'), tooBig)

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/larger than 10 MB/i)
    expect(submitDeclarationForm).not.toHaveBeenCalled()
  })

  it('asks for a receipt when none is attached', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/attach the receipt/i)
    expect(submitDeclarationForm).not.toHaveBeenCalled()
  })
})
