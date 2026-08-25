package cafe.community.backend.model;

/**
 * A state the Aurora screens can be put into from the admin.
 *
 * <p>{@link #OPEN} moves every screen to the carousel handler. {@link #CLOSED} and
 * {@link #LAST_CALL} move every screen to the static poster handler and then show the poster
 * configured for that scene.
 */
public enum ScreenScene {

    OPEN("Open", false),
    LAST_CALL("Last call", true),
    CLOSED("Closed", true);

    private final String displayName;
    private final boolean requiresPoster;

    ScreenScene(String displayName, boolean requiresPoster) {
        this.displayName = displayName;
        this.requiresPoster = requiresPoster;
    }

    public String getDisplayName() {
        return displayName;
    }

    /** Whether applying this scene needs a configured static poster. */
    public boolean requiresPoster() {
        return requiresPoster;
    }
}
