import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { boardMember, boardTerm } from '@cafe/shared-web/testing'
import { CurrentBoardPage, PreviousBoardsPage, SupervisoryBoardPage } from '../pages/BoardPage'

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
  boardTerm({ id: 2, label: 'Board 2025', current: false, bar: 'HUBBLE', members: [boardMember({ id: 2, name: 'Sam Oud', role: 'Treasurer' })] }),
  boardTerm({ id: 3, label: 'Board 2024 Meteor', current: false, bar: 'METEOR', members: [boardMember({ id: 3, name: 'Only Meteor' })] }),
  boardTerm({ id: 4, label: 'Supervisory', type: 'SUPERVISORY', members: [boardMember({ id: 4, name: 'Kim Toezicht', role: 'Chair' })] }),
]

describe('Hubble board pages', () => {
  beforeEach(() => {
    getBoard.mockReset()
    reportApiFailure.mockReset()
  })

  it('current board: shows a skeleton, then the current executive members', async () => {
    getBoard.mockResolvedValue(TERMS)
    renderWith(<CurrentBoardPage />)
    expect(screen.getByTestId('board-skeleton')).toBeInTheDocument()
    expect(await screen.findByText('Robin Bestuur')).toBeInTheDocument()
    expect(screen.getByText('President')).toBeInTheDocument()
    expect(screen.queryByText('Sam Oud')).not.toBeInTheDocument()
  })

  it('current board: says information is coming when there is no current board', async () => {
    getBoard.mockResolvedValue([])
    renderWith(<CurrentBoardPage />)
    expect(await screen.findByText('Board information coming soon.')).toBeInTheDocument()
  })

  it('current board: shows an error and reports it when loading fails', async () => {
    getBoard.mockRejectedValue(new Error('down'))
    renderWith(<CurrentBoardPage />)
    expect(await screen.findByText('Could not load the board. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('Board information coming soon.')).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('board', expect.any(Error))
  })

  it('previous boards: lists Hubble and shared past terms, not Meteor ones', async () => {
    getBoard.mockResolvedValue(TERMS)
    renderWith(<PreviousBoardsPage />)
    expect(await screen.findByRole('heading', { name: 'Board 2025' })).toBeInTheDocument()
    expect(screen.getByText(/Sam Oud/)).toBeInTheDocument()
    expect(screen.queryByText('Board 2024 Meteor')).not.toBeInTheDocument()
  })

  it('previous boards: empty and error states', async () => {
    getBoard.mockResolvedValue([])
    const { unmount } = renderWith(<PreviousBoardsPage />)
    expect(await screen.findByText('No previous board information available.')).toBeInTheDocument()
    unmount()

    getBoard.mockRejectedValue(new Error('down'))
    renderWith(<PreviousBoardsPage />)
    expect(await screen.findByText('Could not load the board. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('No previous board information available.')).not.toBeInTheDocument()
  })

  it('supervisory board: lists its members, and has empty and error states', async () => {
    getBoard.mockResolvedValue(TERMS)
    const first = renderWith(<SupervisoryBoardPage />)
    expect(await screen.findByText('Kim Toezicht (Chair)')).toBeInTheDocument()
    first.unmount()

    getBoard.mockResolvedValue([])
    const second = renderWith(<SupervisoryBoardPage />)
    expect(await screen.findByText('Supervisory board information coming soon.')).toBeInTheDocument()
    second.unmount()

    getBoard.mockRejectedValue(new Error('down'))
    renderWith(<SupervisoryBoardPage />)
    expect(await screen.findByText('Could not load the board. Please try again later.')).toBeInTheDocument()
  })
})
