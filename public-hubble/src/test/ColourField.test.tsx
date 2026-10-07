import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColourField } from '../components/ColourField'
import { normaliseHex } from '../lib/colour'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="c">Colour</label>
      <ColourField id="c" value={value} onChange={setValue} className="" />
      <p>outside</p>
    </>
  )
}

const swatch = () => screen.getByRole('button', { name: 'Pick a colour' })
const input = () => screen.getByLabelText('Colour')

describe('normaliseHex', () => {
  it('accepts six hex digits with or without # and uppercases them', () => {
    expect(normaliseHex('fff200')).toBe('#FFF200')
    expect(normaliseHex(' #a1B2c3 ')).toBe('#A1B2C3')
  })

  it('rejects empty, short or non-hex values', () => {
    expect(normaliseHex('')).toBeNull()
    expect(normaliseHex('#FFF')).toBeNull()
    expect(normaliseHex('#GGGGGG')).toBeNull()
  })
})

describe('ColourField', () => {
  it('shows white when nothing is entered, matching the placeholder', () => {
    render(<Harness />)
    expect(input()).toHaveAttribute('placeholder', '#FFFFFF')
    expect(swatch()).toHaveAttribute('data-colour', '#FFFFFF')
    expect(swatch()).toHaveStyle({ backgroundColor: '#FFFFFF' })
  })

  it('previews a typed hex as soon as it is complete', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(input(), 'e4007')
    expect(swatch()).toHaveAttribute('data-colour', '#FFFFFF')
    await user.type(input(), 'c')
    expect(swatch()).toHaveAttribute('data-colour', '#E4007C')
  })

  it('opens the picker from the swatch and writes the picked colour into the field', async () => {
    const user = userEvent.setup()
    render(<Harness initial="#FFF200" />)
    expect(screen.queryByRole('dialog', { name: 'Colour picker' })).not.toBeInTheDocument()

    await user.click(swatch())
    expect(swatch()).toHaveAttribute('aria-expanded', 'true')
    // react-colorful reads the legacy keyCode, which user-event does not set.
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Hue' }), { key: 'ArrowRight', keyCode: 39 })

    expect(input()).not.toHaveValue('#FFF200')
    expect((input() as HTMLInputElement).value).toMatch(/^#[0-9A-F]{6}$/)
    expect(swatch()).toHaveAttribute('data-colour', (input() as HTMLInputElement).value)
  })

  it('closes on Escape and returns focus to the swatch', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(swatch())
    screen.getByRole('slider', { name: 'Hue' }).focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(swatch()).toHaveFocus()
  })

  it('closes when clicking outside, but not when clicking inside', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(swatch())
    await user.click(screen.getByRole('slider', { name: 'Color' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByText('outside'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
