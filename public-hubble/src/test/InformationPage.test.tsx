import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { InformationPage } from '../pages/InformationPage'
import { expectHiddenHoneypot } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitInformation = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitInformation,
}))

const renderPage = () => render(<MemoryRouter><InformationPage /></MemoryRouter>)

describe('Hubble InformationPage', () => {
  beforeEach(() => {
    submitInformation.mockReset()
    submitInformation.mockResolvedValue(undefined)
  })

  it('sends the question and thanks the visitor', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Name *'), 'Anke')
    await user.type(screen.getByLabelText('Email *'), 'anke@example.com')
    await user.type(screen.getByLabelText('Phone'), '0612345678')
    await user.type(screen.getByLabelText('Message *'), 'Can we host a lecture?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(submitInformation).toHaveBeenCalledWith({
      name: 'Anke', email: 'anke@example.com', phone: '0612345678', message: 'Can we host a lecture?',
      honeypot: '', altcha: '',
    })
    expect(await screen.findByRole('heading', { name: 'Thank you!' })).toBeInTheDocument()
  })

  it('shows the backend validation message, or a general one for other failures', async () => {
    submitInformation.mockRejectedValueOnce(new FormError('message must not be blank'))
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('message must not be blank')

    submitInformation.mockRejectedValueOnce(new Error('boom'))
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('has a hidden honeypot', () => {
    expectHiddenHoneypot(renderPage().container)
  })
})
