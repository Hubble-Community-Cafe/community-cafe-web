import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { ComplaintsPage } from '../pages/ComplaintsPage'
import { expectHiddenHoneypot, pending } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitComplaint = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitComplaint,
}))

const renderPage = () => render(<MemoryRouter><ComplaintsPage /></MemoryRouter>)
type User = ReturnType<typeof userEvent.setup>

async function fill(user: User) {
  await user.type(screen.getByLabelText('Name *'), 'Nora')
  await user.type(screen.getByLabelText('Email *'), 'nora@example.com')
  await user.selectOptions(screen.getByLabelText('Type'), 'COMPLAINT')
  await user.type(screen.getByLabelText('Message *'), 'Music too loud')
}
const send = (user: User) => user.click(screen.getByRole('button', { name: 'Send' }))

describe('Meteor ComplaintsPage', () => {
  beforeEach(() => {
    submitComplaint.mockReset()
    submitComplaint.mockResolvedValue(undefined)
  })

  it('sends what was filled in and thanks the visitor', async () => {
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await send(user)

    expect(submitComplaint).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nora', email: 'nora@example.com', type: 'COMPLAINT', message: 'Music too loud',
      honeypot: '', altcha: '',
    }))
    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument()
  })

  it('shows the backend validation message and keeps the form', async () => {
    submitComplaint.mockRejectedValue(new FormError('message must not be blank'))
    const user = userEvent.setup()
    renderPage()
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('message must not be blank')
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
  })

  it('shows a general message for an unexpected failure', async () => {
    submitComplaint.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
  })

  it('disables the button while sending', async () => {
    const sending = pending()
    submitComplaint.mockReturnValue(sending.promise)
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await send(user)
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    sending.resolve()
    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument()
  })

  it('has a hidden honeypot', () => {
    expectHiddenHoneypot(renderPage().container)
  })
})
