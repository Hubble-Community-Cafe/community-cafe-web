import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { TipsPage } from '../pages/TipsPage'
import { expectHiddenHoneypot, pending } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitTip = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitTip,
}))

const renderPage = () => render(<MemoryRouter><TipsPage /></MemoryRouter>)

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name *'), 'Tess')
  await user.type(screen.getByLabelText('Email *'), 'tess@example.com')
  await user.selectOptions(screen.getByLabelText('Type of submission'), 'IDEA')
  await user.selectOptions(screen.getByLabelText(/receive updates/), 'no')
  await user.type(screen.getByLabelText('Message *'), 'More vegan snacks')
}

describe('Hubble TipsPage', () => {
  beforeEach(() => {
    submitTip.mockReset()
    submitTip.mockResolvedValue(undefined)
  })

  it('sends what was filled in and thanks the visitor', async () => {
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(submitTip).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Tess', email: 'tess@example.com', type: 'IDEA', wantsUpdates: false,
      message: 'More vegan snacks', honeypot: '', altcha: '',
    }))
    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument()
  })

  it('shows the backend validation message and keeps the form', async () => {
    submitTip.mockRejectedValue(new FormError('email must be a well-formed email address'))
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('email must be a well-formed email address')
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: 'Thank you!' })).not.toBeInTheDocument()
  })

  it('shows a general message for an unexpected failure', async () => {
    submitTip.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
  })

  it('disables the button while sending, so it cannot be sent twice', async () => {
    const sending = pending()
    submitTip.mockReturnValue(sending.promise)
    const user = userEvent.setup()
    renderPage()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    sending.resolve()
    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument()
    expect(submitTip).toHaveBeenCalledTimes(1)
  })

  it('has a hidden honeypot that people never fill in', () => {
    const { container } = renderPage()
    expectHiddenHoneypot(container)
  })
})
