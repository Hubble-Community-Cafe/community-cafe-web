import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../lib/usePermissions'
import { useRole } from '../lib/RoleContext'

vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))
const mockUseRole = vi.mocked(useRole)

function withRole(role: 'VIEWER' | 'EDITOR' | 'ADMIN' | null) {
  mockUseRole.mockReturnValue({
    user: null,
    role,
    isLoading: false,
    error: null,
    refetch: () => {},
  })
}

describe('usePermissions', () => {
  it('grants nothing to a viewer', () => {
    withRole('VIEWER')
    const { result } = renderHook(() => usePermissions())
    expect(result.current).toMatchObject({ isEditor: false, isAdmin: false, canManageUsers: false })
  })

  it('grants content editing to an editor but not admin areas', () => {
    withRole('EDITOR')
    const { result } = renderHook(() => usePermissions())
    expect(result.current).toMatchObject({
      isEditor: true,
      isAdmin: false,
      canEditContent: true,
      canManageUsers: false,
      canViewAuditLog: false,
    })
  })

  it('grants everything to an admin', () => {
    withRole('ADMIN')
    const { result } = renderHook(() => usePermissions())
    expect(result.current).toMatchObject({
      isEditor: true,
      isAdmin: true,
      canEditContent: true,
      canManageUsers: true,
      canViewAuditLog: true,
    })
  })
})
