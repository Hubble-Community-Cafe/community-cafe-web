package cafe.community.backend.model;

/**
 * Admin roles. What a staff member may do is decided by their per-module permissions
 * ({@link AdminUser#getPermissions()}); an admin holds every module plus users and the audit log.
 */
public enum AdminRole {
    STAFF("Staff"),
    ADMIN("Admin");

    private final String displayName;

    AdminRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
