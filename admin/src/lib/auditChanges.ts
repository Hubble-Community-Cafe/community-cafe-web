/** One field of an audit entry, as the backend stores it (see the backend FieldChange). */
export interface FieldChange {
  field: string
  oldValue: string | null
  newValue: string | null
}

/** The stored changes of an entry; an empty list when there are none or they cannot be read. */
export function parseChanges(changes: string | null): FieldChange[] {
  if (!changes) return []
  try {
    const parsed: unknown = JSON.parse(changes)
    return Array.isArray(parsed)
      ? parsed.filter((c): c is FieldChange => typeof c === 'object' && c !== null && typeof c.field === 'string')
      : []
  } catch {
    return []
  }
}
