package cafe.community.backend.model;

/** Hierarchical admin roles: ADMIN implies EDITOR implies VIEWER. */
public enum AdminRole {
    VIEWER("Viewer"),
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
