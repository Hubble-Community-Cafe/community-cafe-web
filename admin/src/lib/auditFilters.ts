/**
 * The audit log's filter choices. They mirror the backend enums AuditEntityType and AuditAction
 * one to one (auditFilters.test.ts reads the Java files and fails when they drift): a value missing
 * here is a kind of change staff cannot filter the log down to.
 */
export const AUDIT_ENTITY_TYPES = [
  'ADMIN_USER', 'MEDIA_ASSET', 'MENU_CATEGORY', 'MENU_ITEM', 'DAILY_DISH',
  'OPENING_HOURS', 'HOURS_OVERRIDE', 'EVENT', 'BOARD_TERM', 'BOARD_MEMBER',
  'VACANCY', 'ASSOCIATION', 'SCREEN_SCENE',
]

/** ROLE_CHANGED is no longer written, but older entries still carry it. */
export const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGED', 'PERMISSIONS_CHANGED', 'TOGGLE', 'REORDER', 'SCENE_CHANGED',
]
