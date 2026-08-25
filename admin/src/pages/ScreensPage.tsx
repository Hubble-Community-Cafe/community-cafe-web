import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, DoorClosed, Loader2, Monitor, PlayCircle, Timer } from 'lucide-react'
import { usePermissions } from '../lib/usePermissions'
import {
  fetchScreenScene, applyScreenScene, updateScreenSceneSettings,
  type CurrentScene, type ScreenScene, type ScreenScenePoster, type ScreenSceneStatus,
} from '../lib/api'

const SCENES: { scene: ScreenScene; label: string; hint: string; icon: typeof Monitor }[] = [
  { scene: 'OPEN', label: 'Open', hint: 'Back to the poster carousel', icon: PlayCircle },
  { scene: 'LAST_CALL', label: 'Last call', hint: 'Show the last call slide', icon: Timer },
  { scene: 'CLOSED', label: 'Closed', hint: 'Show the closed slide', icon: DoorClosed },
]

const SCENE_LABELS: Record<CurrentScene, string> = {
  OPEN: 'Open',
  LAST_CALL: 'Last call',
  CLOSED: 'Closed',
  MIXED: 'Mixed',
  UNKNOWN: 'Unknown',
}

/** The live scene, shown honestly: Aurora can also be driven by star-wind from Starcommunity. */
function CurrentSceneBadge({ scene }: { scene: CurrentScene }) {
  const tone =
    scene === 'OPEN' ? 'bg-emerald-50 text-emerald-700'
      : scene === 'CLOSED' ? 'bg-slate-200 text-slate-700'
        : scene === 'LAST_CALL' ? 'bg-amber-50 text-amber-700'
          : 'bg-orange-50 text-orange-700'

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>
      {SCENE_LABELS[scene]}
    </span>
  )
}

function PosterSelect({
  id, label, value, posters, onChange, disabled,
}: {
  id: string
  label: string
  value: number | null
  posters: ScreenScenePoster[]
  onChange: (id: number | null) => void
  disabled: boolean
}) {
  const selected = posters.find((p) => p.id === value)

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">{label}</label>
      <select
        id={id}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm disabled:opacity-50"
      >
        <option value="">Not configured</option>
        {posters.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      {selected?.imageUrl && (
        <img
          src={selected.imageUrl}
          alt={selected.label}
          className="mt-2 h-24 w-full rounded border border-slate-200 object-contain"
        />
      )}
    </div>
  )
}

export function ScreensPage() {
  const { canEditContent } = usePermissions()
  const [status, setStatus] = useState<ScreenSceneStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState<ScreenScene | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const load = useCallback(async () => {
    try {
      setStatus(await fetchScreenScene())
      setError(null)
    } catch {
      setError('Failed to load the screen status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const apply = async (scene: ScreenScene) => {
    setApplying(scene)
    setError(null)
    try {
      await applyScreenScene(scene)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not switch the screens')
    } finally {
      setApplying(null)
    }
  }

  const saveSettings = async (closedPosterId: number | null, lastCallPosterId: number | null) => {
    setSavingSettings(true)
    setError(null)
    try {
      setStatus(await updateScreenSceneSettings({ closedPosterId, lastCallPosterId }))
    } catch {
      setError('Failed to save the poster choices')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Screens</h1>
        <p className="mt-1 text-sm text-slate-500">
          Switch every Aurora screen between the poster carousel and the closed or last call slide.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {!loading && status && !status.available && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          <p className="font-medium text-slate-700">The screens cannot be reached.</p>
          <p className="mt-1">{status.unavailableReason ?? 'Aurora is unavailable.'}</p>
        </section>
      )}

      {!loading && status?.available && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Current scene</h2>
              <CurrentSceneBadge scene={status.currentScene} />
            </div>
            {status.currentScene === 'MIXED' && (
              <p className="mt-2 text-xs text-slate-500">
                The screens are not all showing the same thing. Pick a scene below to line them up.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {SCENES.map(({ scene, label, hint, icon: Icon }) => (
                <button
                  key={scene}
                  type="button"
                  onClick={() => void apply(scene)}
                  disabled={applying !== null}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition disabled:opacity-50 ${
                    status.currentScene === scene
                      ? 'border-hubble-600 bg-hubble-50'
                      : 'border-slate-200 hover:border-hubble-400 hover:bg-slate-50'
                  }`}
                >
                  {applying === scene
                    ? <Loader2 className="h-6 w-6 animate-spin text-hubble-600" />
                    : <Icon className="h-6 w-6 text-hubble-700" />}
                  <span className="font-semibold text-slate-800">{label}</span>
                  <span className="text-xs text-slate-500">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800">Screens</h2>
            {status.screens.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Aurora reports no screens.</p>
            ) : (
              <ul className="mt-2">
                {status.screens.map((screen) => (
                  <li key={screen.id} className="flex items-center gap-3 border-t border-slate-100 py-2.5">
                    <Monitor className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="flex-1 text-sm font-medium text-slate-700">{screen.name}</span>
                    <span className="text-xs text-slate-400">{screen.handler}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canEditContent && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">Posters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Which slide the closed and last call scenes show. Re-upload a slide in Aurora, then
                re-pick it here.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <PosterSelect
                  id="closed-poster"
                  label="Closed"
                  value={status.closedPosterId}
                  posters={status.posters}
                  disabled={savingSettings}
                  onChange={(id) => void saveSettings(id, status.lastCallPosterId)}
                />
                <PosterSelect
                  id="last-call-poster"
                  label="Last call"
                  value={status.lastCallPosterId}
                  posters={status.posters}
                  disabled={savingSettings}
                  onChange={(id) => void saveSettings(status.closedPosterId, id)}
                />
              </div>
              {savingSettings && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </p>
              )}
              {!savingSettings && status.closedPosterId != null && status.lastCallPosterId != null && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                  <Check className="h-3 w-3" /> Both scenes have a slide.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
