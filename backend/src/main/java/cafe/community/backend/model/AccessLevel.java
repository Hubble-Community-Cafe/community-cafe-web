package cafe.community.backend.model;

/**
 * How far a user may use an {@link AdminModule}. EDIT implies VIEW. HIDDEN is never stored: a
 * module without a row is hidden.
 */
public enum AccessLevel {
    HIDDEN,
    VIEW,
    EDIT;

    public boolean includes(AccessLevel other) {
        return ordinal() >= other.ordinal();
    }
}
