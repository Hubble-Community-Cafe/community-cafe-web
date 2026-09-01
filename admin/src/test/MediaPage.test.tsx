import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MediaPage } from '../pages/MediaPage'
import { fetchAllMedia, uploadMedia, deleteMedia } from '../lib/api'
import { usePermissions } from '../lib/usePermissions'
import { MAX_UPLOAD_BYTES } from '../lib/upload'

vi.mock('../lib/api', () => ({
  fetchAllMedia: vi.fn(),
  uploadMedia: vi.fn(),
  deleteMedia: vi.fn(),
}))
vi.mock('../lib/usePermissions', () => ({ usePermissions: vi.fn() }))

const mockFetch = vi.mocked(fetchAllMedia)
const mockUpload = vi.mocked(uploadMedia)
const mockPermissions = vi.mocked(usePermissions)

const asEditor = () => mockPermissions.mockReturnValue({
  isViewer: true, isDddPoster: true, isEditor: true, isAdmin: false,
  canEditContent: true, canEditDailyDish: true, canManageUsers: false, canViewAuditLog: false,
})

/** A File of a given size, without allocating the bytes. */
const fileOfSize = (name: string, bytes: number): File => {
  const file = new File(['x'], name, { type: 'image/jpeg' })
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

const pickFile = (file: File) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

describe('MediaPage uploads', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockResolvedValue([])
    vi.mocked(deleteMedia).mockResolvedValue(undefined as never)
    asEditor()
  })

  it('states the size limit up front', async () => {
    render(<MediaPage />)
    expect(await screen.findByText(/max 10 MB each/)).toBeInTheDocument()
  })

  it('rejects an oversize file without calling the API', async () => {
    render(<MediaPage />)
    await screen.findByText('Upload image')

    pickFile(fileOfSize('holiday.jpg', 24.5 * 1024 * 1024))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('"holiday.jpg" is 24.5 MB, over the 10 MB limit.')
    expect(alert).toHaveTextContent('Please resize or compress the image and try again.')
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('draws the line at exactly the limit', async () => {
    mockUpload.mockRejectedValue(new Error('ignored'))
    render(<MediaPage />)
    await screen.findByText('Upload image')

    pickFile(fileOfSize('exact.jpg', MAX_UPLOAD_BYTES))
    await waitFor(() => expect(mockUpload).toHaveBeenCalledOnce())

    pickFile(fileOfSize('over.jpg', MAX_UPLOAD_BYTES + 1))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('over the 10 MB limit'))
    expect(mockUpload).toHaveBeenCalledOnce()
  })

  it('uploads a file within the limit', async () => {
    mockUpload.mockResolvedValue({
      id: 1, filename: 'ok.jpg', contentType: 'image/jpeg', url: '/media/ok.jpg',
      alt: null, sizeBytes: 2048, bar: null, createdAt: '2026-01-01T00:00:00Z',
    })
    render(<MediaPage />)
    await screen.findByText('Upload image')

    pickFile(fileOfSize('ok.jpg', 2048))

    await waitFor(() => expect(mockUpload).toHaveBeenCalledOnce())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the message from a failed upload', async () => {
    mockUpload.mockRejectedValue(new Error('That file is too large. The maximum upload size is 10 MB.'))
    render(<MediaPage />)
    await screen.findByText('Upload image')

    pickFile(fileOfSize('ok.jpg', 2048))

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('That file is too large. The maximum upload size is 10 MB.')
  })
})
