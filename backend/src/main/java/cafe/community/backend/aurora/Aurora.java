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

    /** One stored file of a poster. {@code name} is the original upload filename. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PosterFile(String location, String name) {
    }

    /**
     * A poster, from {@code GET /handler/screen/poster/items}. Mirrors Aurora's
     * {@code PosterResponse}, trimmed to what we use.
     *
     * <p>Since Aurora's monorepo migration, static and carousel posters share one table and any of
     * them can be shown by the static poster handler. A scene is pinned to a poster by {@code id}.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Poster(long id, String name, String type, List<PosterFile> files, String uri) {

        /** Best available label for the admin picker. */
        public String label() {
            if (name != null && !name.isBlank()) {
                return name;
            }
            PosterFile file = firstFile();
            if (file != null && file.name() != null && !file.name().isBlank()) {
                return file.name();
            }
            if (uri != null && !uri.isBlank()) {
                return uri;
            }
            return "Poster " + id;
        }

        /**
         * Path of the poster image, relative to the Aurora host. Null unless this is an image
         * poster with a file, since videos and external pages cannot be shown as a thumbnail.
         */
        public String imagePath() {
            PosterFile file = firstFile();
            return "img".equals(type) && file != null ? file.location() : null;
        }

        private PosterFile firstFile() {
            return files == null || files.isEmpty() ? null : files.get(0);
        }
    }

    /** Current state of the static poster handler; {@code activePoster} is null when none is shown. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StaticPosterState(Poster activePoster, boolean clockVisible) {
    }
}
