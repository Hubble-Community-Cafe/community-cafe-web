import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MenuPage } from '../pages/MenuPage'
import { getMenu, type MenuTab } from '@cafe/shared-web'

vi.mock('@cafe/shared-web', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cafe/shared-web')>()
  return { ...actual, getMenu: vi.fn() }
})

const mockGetMenu = vi.mocked(getMenu)

const MENU: MenuTab[] = [
  {
    id: 1,
    name: 'Drinks',
    kind: 'DRINK',
    availabilityNote: null,
    sortOrder: 0,
    bar: 'HUBBLE',
    categories: [
      {
        id: 10,
        name: 'Beers',
        kind: 'DRINK',
        availabilityNote: null,
        sortOrder: 0,
        bar: 'HUBBLE',
        parentId: 1,
        items: [
          {
            id: 100,
            categoryId: 10,
            name: 'Pils',
            description: null,
            regularPrice: 2.5,
            studentPrice: null,
            sizeOptions: [],
            dietaryTags: [],
            allergens: [],
            imageUrl: null,
            sortOrder: 0,
            active: true,
          },
        ],
      },
    ],
  },
]

function renderMenu() {
  return render(
    <MemoryRouter>
      <MenuPage />
    </MemoryRouter>,
  )
}

describe('Hubble MenuPage loading', () => {
  beforeEach(() => {
    mockGetMenu.mockReset()
  })

  it('shows the shimmer skeleton while the menu is loading', async () => {
    mockGetMenu.mockResolvedValue(MENU)
    renderMenu()
    expect(screen.getByTestId('menu-skeleton')).toBeInTheDocument()
    await screen.findByText('Pils')
  })

  it('replaces the skeleton with real rows once data arrives', async () => {
    mockGetMenu.mockResolvedValue(MENU)
    renderMenu()
    expect(await screen.findByText('Pils')).toBeInTheDocument()
    expect(screen.queryByTestId('menu-skeleton')).not.toBeInTheDocument()
  })
})
