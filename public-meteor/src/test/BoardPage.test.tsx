import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { boardMember, boardTerm } from '@cafe/shared-web/testing'
import { CurrentBoardPage, PreviousBoardsPage } from '../pages/BoardPage'

const getBoard = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getBoard,
  reportApiFailure,
}))

const renderWith = (page: React.ReactElement) => render(<MemoryRouter>{page}</MemoryRouter>)

const TERMS = [
  boardTerm({ id: 1, label: 'Board 2026', current: true, members: [boardMember({ name: 'Robin Bestuur', role: 'President' })] }),
  boardTerm({ id: 2, label: 'Board 2025', current: false, bar: 'METEOR', members: [boardMember({ id: 2, name: 'Sam Oud' })] }),
  boardTerm({ id: 3, label: 'Hubble 2024', current: false, bar: 'HUBBLE', members: [boardMember({ id: 3, name: 'Only Hubble' })] }),
]

describe('Meteor board pages', () => {
  beforeEach(() => {
    getBoard.mockReset()
    reportApiFailure.mockReset()
  })

  it('current board: skeleton, then the current members', async () => {
    getBoard.mockResolvedValue(TERMS)
    renderWith(<CurrentBoardPage />)
    expect(screen.getByTestId('board-skeleton')).toBeInTheDocument()
    expect(await screen.findByText('Robin Bestuur')).toBeInTheDocument()
  })

  it('current board: coming soon when empty, an error (reported) when loading fails', async () => {
    getBoard.mockResolvedValue([])
    const first = renderWith(<CurrentBoardPage />)
    expect(await screen.findByText('Board information coming soon.')).toBeInTheDocument()
    first.unmount()

    getBoard.mockRejectedValue(new Error('down'))
    renderWith(<CurrentBoardPage />)
    expect(await screen.findByText('Could not load the board. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('Board information coming soon.')).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('board', expect.any(Error))
  })

  it('previous boards: Meteor and shared past terms only, plus empty and error states', async () => {
    getBoard.mockResolvedValue(TERMS)
    const first = renderWith(<PreviousBoardsPage />)
    expect(await screen.findByRole('heading', { name: 'Board 2025' })).toBeInTheDocument()
    expect(screen.queryByText('Hubble 2024')).not.toBeInTheDocument()
    first.unmount()

    getBoard.mockResolvedValue([])
    const second = renderWith(<PreviousBoardsPage />)
    expect(await screen.findByText('No previous board information available.')).toBeInTheDocument()
    second.unmount()

    getBoard.mockRejectedValue(new Error('down'))
    renderWith(<PreviousBoardsPage />)
    expect(await screen.findByText('Could not load the board. Please try again later.')).toBeInTheDocument()
  })
})
