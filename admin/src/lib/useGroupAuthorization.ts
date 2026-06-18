import { useEffect, useState } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { ALLOWED_GROUP_ID, graphConfig } from './authConfig'

interface GroupCheckResult {
  isLoading: boolean
  isAuthorized: boolean
  error: string | null
}

/**
 * Checks that the signed-in user is a member of the allowed Entra security group.
 * When {@link ALLOWED_GROUP_ID} is unset, any authenticated user is authorized.
 */
export function useGroupAuthorization(): GroupCheckResult {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkGroupMembership() {
      if (!ALLOWED_GROUP_ID) {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }
      if (inProgress !== InteractionStatus.None) {
        return
      }
      if (!isAuthenticated || accounts.length === 0) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await instance.acquireTokenSilent({
          scopes: ['GroupMember.Read.All'],
          account: accounts[0],
        })
        const graphResponse = await fetch(graphConfig.graphMemberOfEndpoint, {
          headers: { Authorization: `Bearer ${response.accessToken}` },
        })
        if (!graphResponse.ok) {
          throw new Error('Failed to fetch group membership')
        }
        const data = await graphResponse.json()
        const isMember = data.value?.some((g: { id: string }) => g.id === ALLOWED_GROUP_ID)
        setIsAuthorized(Boolean(isMember))
        if (!isMember) {
          setError('You are not authorized to access this application.')
        }
      } catch (err) {
        console.error('Error checking group membership:', err)
        // Fall back to group claims in the token (when configured to include them).
        const claims = accounts[0]?.idTokenClaims as { groups?: string[] } | undefined
        if (claims?.groups?.includes(ALLOWED_GROUP_ID)) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
          setError('Unable to verify group membership.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkGroupMembership()
  }, [instance, accounts, isAuthenticated, inProgress])

  return { isLoading, isAuthorized, error }
}
