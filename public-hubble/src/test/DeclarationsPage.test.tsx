import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { DeclarationsPage } from '../pages/DeclarationsPage'
import { expectHiddenHoneypot, file } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitDeclarationForm = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitDeclarationForm,
}))

const renderPage = () => render(<MemoryRouter><DeclarationsPage /></MemoryRouter>)
type User = ReturnType<typeof userEvent.setup>

async function fillRequired(user: User) {
  await user.type(screen.getByLabelText('Full name *'), 'Lotte de Vries')
  await user.type(screen.getByLabelText('Email address *'), 'lotte@example.com')
  await user.type(screen.getByLabelText('IBAN *'), 'NL70 TRIO 0338 5890 15')
  await user.type(screen.getByLabelText('Amount in euros *'), '12,50')
}
const send = (user: User) => user.click(screen.getByRole('button', { name: /Send|Submit/ }))

describe('Hubble DeclarationsPage', () => {
  beforeEach(() => {
    submitDeclarationForm.mockReset()
    submitDeclarationForm.mockResolvedValue(undefined)
  })

  it('sends the declaration with its receipt and no bar (Hubble is the default)', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequired(user)
    await user.upload(screen.getByLabelText('Receipt *'), file('receipt.pdf', 'application/pdf'))
    await send(user)

    const data = submitDeclarationForm.mock.calls[0][0] as FormData
    expect(data.get('fullName')).toBe('Lotte de Vries')
    expect(data.get('category')).toBe('Board Costs')
    expect(data.get('bar')).toBeNull()
    expect((data.get('file') as File).name).toBe('receipt.pdf')
    expect(await screen.findByRole('heading', { name: 'Declaration submitted' })).toBeInTheDocument()
  })

  it('refuses a missing, wrong-type or too-large receipt before sending', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await fillRequired(user)

    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Please attach the receipt (PDF or image).')

    await user.upload(screen.getByLabelText('Receipt *'), file('notes.txt', 'text/plain'))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type. Attach a PDF or image.')

    await user.upload(screen.getByLabelText('Receipt *'), file('receipt.pdf', 'application/pdf', 10 * 1024 * 1024 + 1))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('That file is larger than 10 MB.')
    expect(submitDeclarationForm).not.toHaveBeenCalled()
  })

  it('shows the backend validation message, or a general one for other failures', async () => {
    submitDeclarationForm.mockRejectedValueOnce(new FormError('iban is not a valid IBAN'))
    const user = userEvent.setup()
    renderPage()
    await fillRequired(user)
    await user.upload(screen.getByLabelText('Receipt *'), file('receipt.pdf', 'application/pdf'))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('iban is not a valid IBAN')

    submitDeclarationForm.mockRejectedValueOnce(new Error('boom'))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
  })

  it('has a hidden honeypot', () => {
    expectHiddenHoneypot(renderPage().container)
  })
})
