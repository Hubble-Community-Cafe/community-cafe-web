import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@cafe/shared-web'
import {
  MODULES, MODULE_HINTS, MODULE_LABELS, ON_OFF_MODULES, PRESET_LABELS, noAccess, preset,
  type Access, type PresetName,
} from '../../lib/access'
import type { AccessLevel, AdminModule, AdminUser } from '../../lib/api'
import { useChangedSince, useUnsavedChangesGuard } from '../../lib/unsavedChanges'

const LEVEL_LABELS: Record<AccessLevel, string> = { HIDDEN: 'Hidden', VIEW: 'View', EDIT: 'Edit' }
const PRESETS: PresetName[] = ['VIEWER', 'DDD_POSTER', 'EDITOR']

/** One tab's level as a row of radio buttons (Hidden / View / Edit). */
function LevelChoice({ id, module, value, disabled, onChange }: {
  id: string
  module: AdminModule
  value: AccessLevel
  disabled: boolean
  onChange: (level: AccessLevel) => void
}) {
  const levels: AccessLevel[] = ON_OFF_MODULES.includes(module) ? ['HIDDEN', 'EDIT'] : ['HIDDEN', 'VIEW', 'EDIT']
  const labelId = `${id}-${module}-label`
  const hintId = `${id}-${module}-hint`
  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-slate-800">{MODULE_LABELS[module]}</p>
        <p id={hintId} className="text-xs text-slate-500">{MODULE_HINTS[module]}</p>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId}
        className="inline-flex shrink-0 self-start overflow-hidden rounded-lg border border-slate-300 sm:self-auto">
        {levels.map((level) => (
          <label key={level}
            className={cn(
              'px-3 py-1.5 text-sm font-medium focus-within:outline focus-within:outline-2 focus-within:outline-hubble-600',
              value === level ? 'bg-hubble-700 text-white' : 'bg-white text-slate-700',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              !disabled && value !== level && 'hover:bg-slate-50',
            )}>
            <input type="radio" className="sr-only" name={`${id}-${module}`} value={level}
              checked={value === level} disabled={disabled} onChange={() => onChange(level)} />
            {LEVEL_LABELS[level]}
          </label>
        ))}
      </div>
    </div>
  )
}

/** Edit someone's admin switch and per-tab access; presets fill in the tabs in one click. */
export function AccessForm({ user, onSave, onCancel }: {
  user: AdminUser
  onSave: (access: { admin: boolean; permissions: Access }) => Promise<void>
  onCancel: () => void
}) {
  const [admin, setAdmin] = useState(user.admin)
  const [access, setAccess] = useState<Access>({ ...noAccess(), ...user.permissions })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useUnsavedChangesGuard(useChangedSince({ admin, access }))
  const id = `access-${user.id}`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ admin, permissions: access })
    } catch {
      setError('Could not save this access. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} aria-label={`Access for ${user.displayName || user.email}`}
      className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300" />
        <span>
          <span className="block text-sm font-semibold text-slate-800">Admin</span>
          <span className="block text-xs text-slate-500">
            Full access to every tab, plus managing users and reading the audit log.
          </span>
        </span>
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start from</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((name) => (
            <button key={name} type="button" disabled={admin} onClick={() => setAccess(preset(name))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
              {PRESET_LABELS[name]}
            </button>
          ))}
          <button type="button" disabled={admin} onClick={() => setAccess(noAccess())}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
            No access
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white px-3">
        {MODULES.map((module) => (
          <LevelChoice key={module} id={id} module={module} disabled={admin}
            value={admin ? 'EDIT' : access[module]}
            onChange={(level) => setAccess((prev) => ({ ...prev, [module]: level }))} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50">
          <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save access'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="flex items-center gap-1.5 rounded bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          <X className="h-4 w-4" /> Cancel
        </button>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  )
}
