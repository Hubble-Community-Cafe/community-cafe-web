import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useDropdown } from './useDropdown'

function Dropdown() {
  const { open, containerProps, buttonProps, panelProps } = useDropdown()
  return (
    <div>
      <div {...containerProps}>
        <button type="button" {...buttonProps}>Community</button>
        <div {...panelProps} hidden={!open}>
          <a href="#board">Board</a>
          <a href="#vacancies">Vacancies</a>
        </div>
      </div>
      <button type="button">Elsewhere</button>
    </div>
  )
}

const button = () => screen.getByRole('button', { name: 'Community' })

describe('useDropdown', () => {
  it('starts closed, says so, and points the button at its panel', () => {
    render(<Dropdown />)
    expect(button()).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(button().getAttribute('aria-controls')!)).toContainElement(
      screen.getByText('Board', { selector: 'a' }))
  })

  it('opens and closes on a click or tap', () => {
    render(<Dropdown />)
    fireEvent.click(button())
    expect(button()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(button())
    expect(button()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and puts focus back on the button', () => {
    render(<Dropdown />)
    fireEvent.click(button())
    screen.getByRole('link', { name: 'Board' }).focus()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(button()).toHaveAttribute('aria-expanded', 'false')
    expect(button()).toHaveFocus()
  })

  it('closes when clicking or tapping outside, but not inside', () => {
    render(<Dropdown />)
    fireEvent.click(button())
    fireEvent.pointerDown(screen.getByRole('link', { name: 'Board' }))
    expect(button()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(button()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when focus leaves it, and when a link is chosen', () => {
    render(<Dropdown />)
    fireEvent.click(button())
    fireEvent.blur(screen.getByRole('link', { name: 'Vacancies' }),
      { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) })
    expect(button()).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button())
    fireEvent.click(screen.getByRole('link', { name: 'Board' }))
    expect(button()).toHaveAttribute('aria-expanded', 'false')
  })
})
