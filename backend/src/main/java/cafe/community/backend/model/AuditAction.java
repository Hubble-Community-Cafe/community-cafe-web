package cafe.community.backend.model;

/** The kind of change captured by an {@link AuditLog} entry. Extend as needed. */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    ROLE_CHANGED,
    TOGGLE,
    SCENE_CHANGED
}
