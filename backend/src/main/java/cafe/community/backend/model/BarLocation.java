package cafe.community.backend.model;

/**
 * The two cafes. Content scoped to one bar carries this value; a {@code null}
 * bar means the content is shared across both sites.
 */
public enum BarLocation {
    HUBBLE("Hubble Community Cafe"),
    METEOR("Meteor Community Cafe");

    private final String displayName;

    BarLocation(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
