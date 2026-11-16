import { fetchWithAuth, getJson } from './client'

// ── Screen scene types ─────────────────────────────────────────────────────────
/** The scenes the bar can put the Aurora screens into. */
export type ScreenScene = 'OPEN' | 'LAST_CALL' | 'CLOSED'

/** What the screens are doing now. MIXED means they disagree or sit on another handler. */
export type CurrentScene = ScreenScene | 'MIXED' | 'UNKNOWN'

export interface ScreenSceneScreen {
  id: number
  name: string
  handler: string
}

export interface ScreenScenePoster {
  id: number
  label: string
  imageUrl: string | null
}

export interface ScreenSceneStatus {
  available: boolean
  unavailableReason: string | null
  currentScene: CurrentScene
  activePosterId: number | null
  closedPosterId: number | null
  lastCallPosterId: number | null
  screens: ScreenSceneScreen[]
  posters: ScreenScenePoster[]
}

export interface ScreenSceneSettingsRequest {
  closedPosterId: number | null
  lastCallPosterId: number | null
}

// ── Screen scene endpoints ─────────────────────────────────────────────────────
export const fetchScreenScene = () =>
  getJson<ScreenSceneStatus>('/api/admin/screens/scene')

/** Applying a scene talks to Aurora, so surface its message rather than a generic failure. */
export const applyScreenScene = async (scene: ScreenScene): Promise<void> => {
  const response = await fetchWithAuth(`/api/admin/screens/scene/${scene}`, { method: 'POST' })
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(err.message ?? `Could not switch the screens (${response.status})`)
  }
}

export const updateScreenSceneSettings = (req: ScreenSceneSettingsRequest) =>
  getJson<ScreenSceneStatus>('/api/admin/screens/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
