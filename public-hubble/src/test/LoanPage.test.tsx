import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { LoanPage } from '../pages/LoanPage'
import { expectHiddenHoneypot } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitLoan = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitLoan,
}))

const renderPage = () => render(<MemoryRouter><LoanPage /></MemoryRouter>)

describe('Hubble LoanPage', () => {
  beforeEach(() => {
    submitLoan.mockReset()
    submitLoan.mockResolvedValue(undefined)
  })

  it('sends the loan request with pick-up and return moments', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Name *'), 'Sven')
    await user.type(screen.getByLabelText('Association *'), 'Inter Actief')
    await user.type(screen.getByLabelText('Email *'), 'sven@example.com')
    await user.type(screen.getByLabelText('Pick-up date *'), '2030-10-01')
    await user.type(screen.getByLabelText('Pick-up time *'), '10:00')
    await user.type(screen.getByLabelText('Return date *'), '2030-10-02')
    await user.type(screen.getByLabelText('Return time *'), '12:00')
    await user.type(screen.getByLabelText('Message *'), 'Two speakers please')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(submitLoan).toHaveBeenCalledWith({
      name: 'Sven', association: 'Inter Actief', email: 'sven@example.com',
      pickupDate: '2030-10-01', pickupTime: '10:00', returnDate: '2030-10-02', returnTime: '12:00',
      message: 'Two speakers please', honeypot: '', altcha: '',
    })
    expect(await screen.findByRole('heading', { name: 'Request received' })).toBeInTheDocument()
  })

  it('shows the backend validation message', async () => {
    submitLoan.mockRejectedValue(new FormError('The return must be after the pick-up.'))
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The return must be after the pick-up.')
  })

  it('has a hidden honeypot', () => {
    expectHiddenHoneypot(renderPage().container)
  })
})
