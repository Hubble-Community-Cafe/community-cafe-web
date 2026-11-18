import { describe, expect, it } from 'vitest'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../lib/auditFilters'
import actionSource from '../../../backend/src/main/java/cafe/community/backend/model/AuditAction.java?raw'
import entitySource from '../../../backend/src/main/java/cafe/community/backend/model/AuditEntityType.java?raw'

/** The constants of a Java enum, read from its source: the names before the first semicolon. */
function enumConstants(source: string): string[] {
  const body = source.slice(source.indexOf('{', source.indexOf('enum ')) + 1)
  return body.slice(0, body.indexOf(';') === -1 ? body.indexOf('}') : body.indexOf(';'))
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
    .split(',')
    .map((name) => name.trim().split(/[\s(]/)[0])
    .filter(Boolean)
}

/**
 * The audit log filters are copied from the backend enums, and drifted once: reordering and screen
 * changes were logged but could not be filtered on. Any new backend value now fails here first.
 */
describe('audit log filters', () => {
  it('offer every action the backend records', () => {
    expect([...AUDIT_ACTIONS].sort()).toEqual(enumConstants(actionSource).sort())
  })

  it('offer every kind of item the backend records', () => {
    expect([...AUDIT_ENTITY_TYPES].sort()).toEqual(enumConstants(entitySource).sort())
  })
})
