package cafe.community.backend.model;

/**
 * Admin roles. What a non-admin may do is decided by their per-module permissions
 * ({@link AdminUser#getPermissions()}); ADMIN holds every module plus users and the audit log.
 *
 * <p>STAFF is a non-admin whose access was set per tab. VIEWER, DDD_POSTER and EDITOR are the
 * old hierarchical roles, kept until every account is moved to STAFF; their permissions are the
 * matching {@link AccessPresets}.
 */
public enum AdminRole {
    STAFF("Staff"),
    VIEWER("Viewer"),
    DDD_POSTER("DDD poster"),
    EDITOR("Editor"),
    ADMIN("Admin");

    private final String displayName;

    AdminRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
