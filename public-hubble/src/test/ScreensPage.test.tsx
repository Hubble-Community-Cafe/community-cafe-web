import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormError } from '@cafe/shared-web'
import { ScreensPage } from '../pages/ScreensPage'
import { expectHiddenHoneypot, file } from './formTestUtils'

vi.mock('altcha', () => ({}))
const submitScreenForm = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  submitScreenForm,
}))

const renderPage = () => render(<MemoryRouter><ScreensPage /></MemoryRouter>)
type User = ReturnType<typeof userEvent.setup>

async function fillContact(user: User) {
  await user.type(screen.getByLabelText('Name *'), 'Jamie')
  await user.type(screen.getByLabelText('Association *'), 'Inter Actief')
  await user.type(screen.getByLabelText('Email *'), 'jamie@example.com')
}
async function fillDates(user: User, start: string, end: string) {
  await user.type(screen.getByLabelText(/^Start date/), start)
  await user.type(screen.getByLabelText(/^End date/), end)
}
const send = (user: User) => user.click(screen.getByRole('button', { name: /Send|Submit/ }))

describe('Hubble ScreensPage', () => {
  beforeEach(() => {
    submitScreenForm.mockReset()
    submitScreenForm.mockResolvedValue(undefined)
  })

  it('uploads the poster with its dates and no cafe', async () => {
    const user = userEvent.setup()
    renderPage()
    // Hubble and Meteor share the same screens, so there is nothing to choose.
    expect(screen.queryByLabelText(/Which café/)).not.toBeInTheDocument()
    await fillContact(user)
    await fillDates(user, '2030-10-01', '2030-10-14')
    await user.upload(screen.getByLabelText('Poster file *'), file('poster.png', 'image/png'))
    await send(user)

    const data = submitScreenForm.mock.calls[0][0] as FormData
    expect(data.has('cafe')).toBe(false)
    expect(data.get('startDate')).toBe('2030-10-01')
    expect(data.get('permanent')).toBe('false')
    expect((data.get('file') as File).name).toBe('poster.png')
    expect(await screen.findByRole('heading', { name: 'Request received' })).toBeInTheDocument()
  })

  it('a permanent poster needs no dates', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillContact(user)
    await user.click(screen.getByRole('checkbox', { name: /permanent poster/ }))
    await user.upload(screen.getByLabelText('Poster file *'), file('poster.jpg', 'image/jpeg'))
    await send(user)

    expect((submitScreenForm.mock.calls[0][0] as FormData).get('permanent')).toBe('true')
  })

  it('refuses a missing, wrong-type or too-large file before sending', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await fillContact(user)
    await fillDates(user, '2030-10-01', '2030-10-14')

    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Please choose a poster file (JPG, PNG or MP4).')

    await user.upload(screen.getByLabelText('Poster file *'), file('poster.gif', 'image/gif'))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type. Use JPG, PNG or MP4.')

    await user.upload(screen.getByLabelText('Poster file *'), file('poster.png', 'image/png', 10 * 1024 * 1024 + 1))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('That file is larger than 10 MB.')
    expect(submitScreenForm).not.toHaveBeenCalled()
  })

  it('refuses missing dates and an end before the start', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillContact(user)
    await user.upload(screen.getByLabelText('Poster file *'), file('poster.png', 'image/png'))

    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Please choose a start and end date')

    await fillDates(user, '2030-10-14', '2030-10-01')
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('The end date must be on or after the start date.')
    expect(submitScreenForm).not.toHaveBeenCalled()
  })

  it('shows the backend validation message', async () => {
    submitScreenForm.mockRejectedValue(new FormError('association must not be blank'))
    const user = userEvent.setup()
    renderPage()
    await fillDates(user, '2030-10-01', '2030-10-14')
    await user.upload(screen.getByLabelText('Poster file *'), file('poster.png', 'image/png'))
    await send(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('association must not be blank')
  })

  it('has a hidden honeypot', () => {
    expectHiddenHoneypot(renderPage().container)
  })
})
