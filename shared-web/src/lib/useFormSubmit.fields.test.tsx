import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useFormSubmit, type FormProblem } from './useFormSubmit'
import { FormError } from '../api/forms'

/** A form wired the way the public forms are: formProps, fieldProps per field, errorId on the message. */
function TestForm({ submit, check }: { submit: () => Promise<unknown>; check?: () => FormProblem | null }) {
  const { error, errorId, send, fieldProps, formProps } = useFormSubmit()
  return (
    <form {...formProps} onSubmit={(e) => { e.preventDefault(); void send(submit, check) }}>
      <label htmlFor="name">Name *</label>
      <input id="name" required {...fieldProps('name')} />
      <label htmlFor="email">Email address <span>(for a reply)</span> *</label>
      <input id="email" type="email" required {...fieldProps('email')} />
      <label htmlFor="iban">IBAN</label>
      <input id="iban" {...fieldProps('iban')} />
      {error && <p id={errorId} role="alert">{error}</p>}
      <button type="submit">Send</button>
    </form>
  )
}

const type = (label: string | RegExp, value: string) =>
  fireEvent.input(screen.getByLabelText(label), { target: { value } })
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send' }))

describe('useFormSubmit marks the fields a failure is about', () => {
  it('names and marks every field the browser finds wrong, focuses the first, and sends nothing', async () => {
    const submit = vi.fn()
    render(<TestForm submit={submit} />)
    type(/^Email address/, 'not an address')
    send()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Please fill in: Name. Please check: Email address.')
    for (const field of [screen.getByLabelText('Name *'), screen.getByLabelText(/^Email address/)]) {
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(field).toHaveAttribute('aria-describedby', alert.id)
    }
    expect(screen.getByLabelText('IBAN')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('Name *')).toHaveFocus()
    expect(submit).not.toHaveBeenCalled()
  })

  it('stops marking a field once it is changed, and only that one', async () => {
    render(<TestForm submit={vi.fn()} />)
    send()
    await screen.findByRole('alert')

    type('Name *', 'Lotte')
    expect(screen.getByLabelText('Name *')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(/^Email address/)).toHaveAttribute('aria-invalid', 'true')
  })

  it("marks the field the backend refused, with the backend's message", async () => {
    render(<TestForm submit={() => Promise.reject(new FormError('IBAN must be a valid IBAN', 'iban'))} />)
    type('Name *', 'Lotte')
    type(/^Email address/, 'lotte@example.com')
    send()

    expect(await screen.findByRole('alert')).toHaveTextContent('IBAN must be a valid IBAN')
    expect(screen.getByLabelText('IBAN')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('IBAN')).toHaveFocus()
    expect(screen.getByLabelText('Name *')).not.toHaveAttribute('aria-invalid')
  })

  it("marks the field the form's own check names, and none for a message alone", async () => {
    const check = vi.fn<() => FormProblem | null>()
      .mockReturnValueOnce({ message: 'Please attach the receipt.', field: 'iban' })
      .mockReturnValueOnce('Something about the whole form.')
    render(<TestForm submit={vi.fn()} check={check} />)
    type('Name *', 'Lotte')
    type(/^Email address/, 'lotte@example.com')

    send()
    expect(await screen.findByRole('alert')).toHaveTextContent('Please attach the receipt.')
    expect(screen.getByLabelText('IBAN')).toHaveAttribute('aria-invalid', 'true')

    send()
    expect(await screen.findByRole('alert')).toHaveTextContent('Something about the whole form.')
    expect(screen.getByLabelText('IBAN')).not.toHaveAttribute('aria-invalid')
  })
})
