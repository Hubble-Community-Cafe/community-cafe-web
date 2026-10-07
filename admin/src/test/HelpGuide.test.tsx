import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HelpGuide, PageHelp } from '../components/HelpGuide'
import { GUIDES, type Guide } from '../lib/guideContent'
import { renderGuideText } from '../lib/guideText'
import { NAV } from '../navigation'

const ROUTES = NAV.flatMap((section) => section.items.map((item) => item.to))

describe('in-app help content', () => {
  it('has a guide for every page in the navigation, so no module ships without help', () => {
    for (const route of ROUTES) {
      const guide = GUIDES[route]
      expect(guide, `guide for ${route}`).toBeDefined()
      expect(guide.title).not.toBe('')
      expect(guide.sections.length, `sections for ${route}`).toBeGreaterThan(0)
      for (const section of guide.sections) {
        expect(section.title).not.toBe('')
        expect(section.content.trim().length, `${route} / ${section.title}`).toBeGreaterThan(40)
      }
    }
  })

  it('tells staff that poster requests are reviewed in Aurora, not on the Screens page', () => {
    const section = GUIDES['/screens'].sections.find((s) => s.title === 'Poster requests from the website')
    expect(section?.content).toContain('**Poster requests**')
    expect(section?.content).toContain('not** in Aurora')
  })

  it('follows the house style: no em dashes', () => {
    const text = JSON.stringify(GUIDES)
    expect(text).not.toContain('—')
  })
})

describe('PageHelp', () => {
  const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><PageHelp /></MemoryRouter>)

  it('shows a Help button on a page with a guide', () => {
    renderAt('/menu')
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument()
  })

  it('shows nothing on a page without a guide', () => {
    const { container } = renderAt('/login')
    expect(container).toBeEmptyDOMElement()
  })
})

describe('HelpGuide dialog', () => {
  const GUIDE: Guide = {
    title: 'Menu',
    sections: [
      { title: 'First topic', content: 'The **first** topic.' },
      { title: 'Second topic', content: 'The second topic.' },
    ],
  }

  it('opens as a dialog with focus on Close, and returns focus to Help when closed', async () => {
    const user = userEvent.setup()
    render(<HelpGuide guide={GUIDE} />)
    const help = screen.getByRole('button', { name: 'Help' })

    await user.click(help)
    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(within(dialog).getByRole('button', { name: 'Close help' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Close help' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(help).toHaveFocus()
  })

  it('moves between topics with the topic list and Next/Previous, and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<HelpGuide guide={GUIDE} />)
    await user.click(screen.getByRole('button', { name: 'Help' }))
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByRole('heading', { name: 'First topic' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: /Next/ }))
    expect(within(dialog).getByRole('heading', { name: 'Second topic' })).toBeInTheDocument()
    expect(within(dialog).getByText('2 of 2')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'First topic' }))
    expect(within(dialog).getByRole('heading', { name: 'First topic' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('renderGuideText', () => {
  it('renders headings, bullets, steps and inline bold, italic and code', () => {
    render(<div>{renderGuideText('## Heading\nSome **bold**, *italic* and `code`.\n- one\n- two\n1. step\n2. next')}</div>)
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
    expect(screen.getByText('code').tagName).toBe('CODE')
    const [bullets, steps] = screen.getAllByRole('list')
    expect(bullets.tagName).toBe('UL')
    expect(within(bullets).getAllByRole('listitem')).toHaveLength(2)
    expect(steps.tagName).toBe('OL')
  })
})
