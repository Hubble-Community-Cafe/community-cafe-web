import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFormSubmit } from './useFormSubmit'
import { FormError } from '../api/forms'
import { checkUpload, RECEIPT_UPLOAD } from './upload'

describe('useFormSubmit', () => {
  it('sends with the ALTCHA payload and ends as sent', async () => {
    const submit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useFormSubmit())

    act(() => result.current.setAltcha('solved'))
    await act(() => result.current.send(submit))

    expect(submit).toHaveBeenCalledWith('solved')
    expect(result.current.status).toBe('sent')
    expect(result.current.error).toBeNull()
  })

  it('sends an empty payload when the ALTCHA was not solved', async () => {
    const submit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useFormSubmit())

    await act(() => result.current.send(submit))
    expect(submit).toHaveBeenCalledWith('')
  })

  it('shows a backend message as is, and anything else as a generic text', async () => {
    const { result } = renderHook(() => useFormSubmit())

    await act(() => result.current.send(() => Promise.reject(new FormError('Please enter your e-mail.'))))
    expect(result.current).toMatchObject({ status: 'idle', error: 'Please enter your e-mail.' })

    await act(() => result.current.send(() => Promise.reject(new TypeError('Failed to fetch'))))
    expect(result.current).toMatchObject({ status: 'idle', error: 'Something went wrong. Please try again.' })
  })

  it('does not send when the check finds a problem', async () => {
    const submit = vi.fn()
    const { result } = renderHook(() => useFormSubmit())

    await act(() => result.current.send(submit, () => 'Please attach the receipt.'))

    expect(submit).not.toHaveBeenCalled()
    expect(result.current).toMatchObject({ status: 'idle', error: 'Please attach the receipt.' })
  })

  it('clears the previous error when sending again', async () => {
    const { result } = renderHook(() => useFormSubmit())
    await act(() => result.current.send(vi.fn(), () => 'First problem'))
    await act(() => result.current.send(vi.fn().mockResolvedValue(undefined)))
    expect(result.current.error).toBeNull()
  })
})

describe('checkUpload', () => {
  const file = (type: string, size: number) => new File([new Uint8Array(size)], 'f', { type })

  it('names what is wrong with the file, in the order a visitor would fix it', () => {
    expect(checkUpload(null, RECEIPT_UPLOAD)).toBe('Please attach the receipt (PDF or image).')
    expect(checkUpload(file('text/html', 10), RECEIPT_UPLOAD)).toBe('Unsupported file type. Attach a PDF or image.')
    expect(checkUpload(file('application/pdf', 10 * 1024 * 1024 + 1), RECEIPT_UPLOAD))
      .toBe('That file is larger than 10 MB.')
  })

  it('accepts a file of an allowed type within the limit', () => {
    expect(checkUpload(file('image/png', 1024), RECEIPT_UPLOAD)).toBeNull()
    expect(checkUpload(file('application/pdf', 10 * 1024 * 1024), RECEIPT_UPLOAD)).toBeNull()
  })
})
