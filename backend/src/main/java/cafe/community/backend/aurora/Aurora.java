package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * The slice of Aurora's API responses we read. Grouped in one place because they are a single
 * external contract, not domain types of ours. Unknown fields are ignored throughout: this is an
 * API we do not control and do not want to break on.
 */
public final class Aurora {

    private Aurora() {
    }

    /** A screen entity. Mirrors Aurora's {@code ScreenResponse}, trimmed to what we use. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Screen(long id, String name) {
    }

    /**
     * One screen handler and the screens attached to it, from {@code GET /handler/screen}.
     *
     * <p>{@code name} is Aurora's handler class name (for example {@code StaticPosterHandler}),
     * which is also what {@code POST /handler/screen/{id}} expects. {@code id} is a per-process
     * UUID, not a stable identifier, so we never key on it.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScreenHandler(String id, String name, List<Screen> entities) {
    }

    /** The stored file behind a static poster. {@code name} is the original upload filename. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PosterFile(String location, String name) {
    }

    /**
     * A static poster, from {@code GET /handler/screen/poster/static/items}.
     *
     * <p>Aurora gives static posters no name of their own, so a scene is pinned to a poster by
     * {@code id} and the admin picker labels it with the filename or URI.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Poster(long id, String createdAt, String updatedAt, PosterFile file, String uri) {

        /** Best available label, since Aurora stores no name. */
        public String label() {
            if (file != null && file.name() != null && !file.name().isBlank()) {
                return file.name();
            }
            if (uri != null && !uri.isBlank()) {
                return uri;
            }
            return "Poster " + id;
        }

        /** Path of the poster image, relative to the Aurora client host. Null when there is no file. */
        public String imagePath() {
            return file == null ? null : file.location();
        }
    }

    /** Current state of the static poster handler; {@code activePoster} is null when none is shown. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StaticPosterState(Poster activePoster, boolean clockVisible) {
    }
}
