import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../lib/usePermissions'
import { useRole } from '../lib/RoleContext'
import type { AdminUser } from '../lib/api'
import { adminUser, presetUser, staffUser } from './access'

vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))
const mockUseRole = vi.mocked(useRole)

function signedInAs(user: AdminUser | null) {
  mockUseRole.mockReturnValue({ user, role: user?.role ?? null, isLoading: false, error: null, refetch: () => {} })
  return renderHook(() => usePermissions()).result.current
}

describe('usePermissions', () => {
  it('grants nothing while signed out or loading', () => {
    const p = signedInAs(null)
    expect(p.isAdmin).toBe(false)
    expect(p.canView('MENU')).toBe(false)
  })

  it('grants nothing to a new account', () => {
    const p = signedInAs(staffUser())
    expect(p.canView('MENU')).toBe(false)
    expect(p.canView('SCREENS')).toBe(false)
    expect(p.canManageUsers).toBe(false)
  })

  it('follows the level of each tab on its own', () => {
    const p = signedInAs(staffUser({ EVENTS: 'EDIT', MENU: 'VIEW' }))
    expect(p.canView('EVENTS')).toBe(true)
    expect(p.canEdit('EVENTS')).toBe(true)
    expect(p.canView('MENU')).toBe(true)
    expect(p.canEdit('MENU')).toBe(false)
    expect(p.canView('BOARD')).toBe(false)
  })

  it('keeps the old DDD poster access', () => {
    const p = signedInAs(presetUser('DDD_POSTER'))
    expect(p.canEdit('DAILY_DISH')).toBe(true)
    expect(p.canEdit('MENU')).toBe(false)
    expect(p.canView('MENU')).toBe(true)
  })

  it('grants everything to an admin, including users and the audit log', () => {
    const p = signedInAs(adminUser())
    expect(p.canEdit('SCREEN_POSTERS')).toBe(true)
    expect(p.canManageUsers).toBe(true)
    expect(p.canViewAuditLog).toBe(true)
  })
})
