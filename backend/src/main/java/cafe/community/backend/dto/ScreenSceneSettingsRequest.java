package cafe.community.backend.dto;

/**
 * Which Aurora static poster each scene should show. Either may be null to leave that scene
 * unconfigured; the scene then refuses to apply rather than showing the wrong poster.
 */
public record ScreenSceneSettingsRequest(
        Long closedPosterId,
        Long lastCallPosterId
) {
}
