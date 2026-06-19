package cafe.community.backend.model;

/**
 * Hierarchical admin roles: ADMIN implies EDITOR implies DDD_POSTER implies VIEWER.
 * DDD_POSTER is a narrow tier just above VIEWER: read-only everywhere, plus the
 * ability to edit the Daily Dinner Dish.
 */
public enum AdminRole {
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
