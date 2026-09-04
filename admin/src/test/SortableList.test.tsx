import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SortableList } from '../components/SortableList'
import { reorderById } from '../lib/reorder'

interface Row { id: number; name: string }

const rows: Row[] = [
  { id: 1, name: 'Amstel' },
  { id: 2, name: 'Brand' },
  { id: 3, name: 'Cornet' },
]

const getId = (r: Row) => r.id
const labelFor = (r: Row) => r.name

function renderList(props: Partial<Parameters<typeof SortableList<Row>>[0]> = {}) {
  const onReorder = vi.fn()
  render(
    <SortableList items={rows} getId={getId} labelFor={labelFor} onReorder={onReorder} {...props}>
      {(row, handle) => (
        <div>
          {handle}
          <span>{row.name}</span>
        </div>
      )}
    </SortableList>,
  )
  return { onReorder }
}

describe('reorderById', () => {
  it('moves a row down to the position it was dropped on', () => {
    expect(reorderById(rows, getId, 1, 3)?.map(getId)).toEqual([2, 3, 1])
  })

  it('moves a row up to the position it was dropped on', () => {
    expect(reorderById(rows, getId, 3, 1)?.map(getId)).toEqual([3, 1, 2])
  })

  it('reports no change when a row is dropped on itself', () => {
    expect(reorderById(rows, getId, 2, 2)).toBeNull()
  })

  /** A row deleted in another tab can still be named by a drop that started before the refresh. */
  it('reports no change when either row is no longer in the list', () => {
    expect(reorderById(rows, getId, 99, 1)).toBeNull()
    expect(reorderById(rows, getId, 1, 99)).toBeNull()
  })

  it('leaves the original list untouched', () => {
    reorderById(rows, getId, 1, 3)
    expect(rows.map(getId)).toEqual([1, 2, 3])
  })
})

describe('SortableList', () => {
  it('renders every row', () => {
    renderList()
    expect(screen.getByText('Amstel')).toBeInTheDocument()
    expect(screen.getByText('Cornet')).toBeInTheDocument()
  })

  it('gives each row a handle named after it', () => {
    renderList()
    expect(screen.getByRole('button', { name: 'Reorder Amstel' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Reorder / })).toHaveLength(3)
  })

  /** The handle must be reachable and operable without a pointer. */
  it('exposes the handle as a focusable button with keyboard instructions', () => {
    renderList()
    const handle = screen.getByRole('button', { name: 'Reorder Amstel' })
    expect(handle).toHaveAttribute('aria-roledescription', 'sortable')
    expect(handle).toHaveAttribute('aria-describedby')
    expect(handle).not.toHaveAttribute('disabled')
  })

  it('drops the handles for a viewer who cannot edit', () => {
    renderList({ disabled: true })
    expect(screen.queryByRole('button', { name: /^Reorder / })).not.toBeInTheDocument()
    expect(screen.getByText('Amstel')).toBeInTheDocument()
  })
})
