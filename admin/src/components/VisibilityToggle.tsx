import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * One-click show/hide control for a menu tab, sub-heading or item. Updates optimistically
 * and rolls back if the request fails, so hiding something mid-shift is instant.
 */
export function VisibilityToggle({
  active,
  label,
  onToggle,
}: {
  active: boolean
  /** Used for the accessible name, e.g. the category or item name. */
  label: string
  onToggle: (next: boolean) => Promise<unknown>
}) {
  const [busy, setBusy] = useState(false)

  const click = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await onToggle(!active)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      aria-pressed={!active}
      title={active ? `Hide ${label} from the site` : `Show ${label} on the site`}
      aria-label={active ? `Hide ${label} from the site` : `Show ${label} on the site`}
      className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
        active
          ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
      }`}
    >
      {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  )
}
