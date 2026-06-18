/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import { fetchCurrentUser, type AdminRole, type AdminUser } from './api'
import { isE2E } from './e2eAuth'

interface RoleContextValue {
  user: AdminUser | null
  role: AdminRole | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const RoleContext = createContext<RoleContextValue>({
  user: null,
  role: null,
  isLoading: true,
  error: null,
  refetch: () => {},
})

export function useRole() {
  return useContext(RoleContext)
}

export function RoleProvider({ children }: { children: ReactNode }) {
  // e2e runs are not MSAL-authenticated but still load their role from the backend.
  const isAuthenticated = useIsAuthenticated() || isE2E()
  const [user, setUser] = useState<AdminUser | null>(null)
  // Start in the loading state only when we expect to fetch (authenticated).
  const [isLoading, setIsLoading] = useState(() => isAuthenticated)
  const [error, setError] = useState<string | null>(null)

  // All state updates happen after the await, so the effect never sets state
  // synchronously (avoids cascading renders).
  const load = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const current = await fetchCurrentUser()
      setUser(current)
      setError(null)
    } catch (e) {
      console.error('Failed to fetch current user role:', e)
      setError('Failed to load user role')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    load()
    const handleAccountChanged = () => load()
    window.addEventListener('msal:accountChanged', handleAccountChanged)
    return () => window.removeEventListener('msal:accountChanged', handleAccountChanged)
  }, [load])

  return (
    <RoleContext.Provider
      value={{ user, role: user?.role ?? null, isLoading, error, refetch: load }}
    >
      {children}
    </RoleContext.Provider>
  )
}
