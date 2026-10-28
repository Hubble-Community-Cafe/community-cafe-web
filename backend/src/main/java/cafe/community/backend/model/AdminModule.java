package cafe.community.backend.model;

/**
 * An admin tab (or part of one) that access can be granted on per user. Users and the audit log
 * are not modules: they stay with the admin switch ({@link AdminRole#ADMIN}).
 */
public enum AdminModule {
    MENU,
    DAILY_DISH,
    OPENING_HOURS,
    EVENTS,
    BOARD,
    VACANCIES,
    ASSOCIATIONS,
    MEDIA,
    /** The Screens tab: VIEW shows the live state, EDIT switches the scene (a bar-shift action). */
    SCREENS,
    /** Choosing the closed and last-call posters. Only EDIT means anything here. */
    SCREEN_POSTERS;

    /** The authority a user holds when they have at least {@code level} on this module. */
    public String authority(AccessLevel level) {
        return name() + "_" + level.name();
    }
}
