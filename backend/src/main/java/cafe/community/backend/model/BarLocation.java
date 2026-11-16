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

    /**
     * A bar from a request field: blank means shared (null). Use this instead of {@code valueOf},
     * whose error message names the Java class and would be shown to the client as is.
     */
    public static BarLocation parseOrShared(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown bar: " + value + ". Use HUBBLE or METEOR.");
        }
    }
}
