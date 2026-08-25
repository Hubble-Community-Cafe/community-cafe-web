package cafe.community.backend.dto;

import java.util.List;

/**
 * Everything the admin screen panel needs in one call: what the screens are doing now, which
 * scene that adds up to, and the posters available to pick from.
 *
 * <p>{@code currentScene} is derived from what Aurora reports and is {@code MIXED} when the
 * screens disagree or sit on some other handler. We report that honestly rather than guessing,
 * because star-wind also drives these screens from Starcommunity webhooks and can change them
 * underneath us.
 */
public record ScreenSceneStatusDto(
        boolean available,
        String unavailableReason,
        String currentScene,
        Long activePosterId,
        Long closedPosterId,
        Long lastCallPosterId,
        List<Screen> screens,
        List<Poster> posters
) {

    /** A screen and the Aurora handler it is currently attached to. */
    public record Screen(long id, String name, String handler) {
    }

    /** A static poster the board can point a scene at. {@code imageUrl} may be null. */
    public record Poster(long id, String label, String imageUrl) {
    }

    public static ScreenSceneStatusDto unavailable(String reason) {
        return new ScreenSceneStatusDto(false, reason, "UNKNOWN", null, null, null, List.of(), List.of());
    }
}
