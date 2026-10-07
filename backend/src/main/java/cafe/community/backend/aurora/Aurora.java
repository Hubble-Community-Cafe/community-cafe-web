package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;

import java.time.OffsetDateTime;
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

    /**
     * A poster request for {@code POST /handler/screen/poster/requests}. A reviewer approves,
     * edits or denies it in the Aurora backoffice. Optional fields are null when not sent, so
     * Aurora's own defaults apply.
     *
     * <p>{@link #toMultipart()} is the single place that knows Aurora's field names and limits;
     * keep it in line with Aurora's {@code PosterRequestController}.
     */
    public record PosterRequest(
            String requesterName,
            String requesterEmail,
            String requesterAssociation,
            String message,
            String name,
            String label,
            OffsetDateTime startDate,
            OffsetDateTime expirationDate,
            String accentColor,
            Integer defaultTimeout,
            Upload file) {

        /** The multipart body Aurora expects. Only a file is sent, never a {@code uri}. */
        public MultipartBodyBuilder toMultipart() {
            MultipartBodyBuilder body = new MultipartBodyBuilder();
            body.part("requesterName", requesterName);
            body.part("requesterEmail", requesterEmail);
            body.part("name", name);
            optional(body, "requesterAssociation", requesterAssociation);
            optional(body, "message", message);
            optional(body, "label", label);
            optional(body, "startDate", startDate == null ? null : startDate.toString());
            optional(body, "expirationDate", expirationDate == null ? null : expirationDate.toString());
            optional(body, "accentColor", accentColor);
            optional(body, "defaultTimeout", defaultTimeout == null ? null : defaultTimeout.toString());
            body.part("file", file.data())
                    .filename(file.filename())
                    .contentType(MediaType.parseMediaType(file.contentType()));
            return body;
        }

        private static void optional(MultipartBodyBuilder body, String field, String value) {
            if (value != null && !value.isBlank()) {
                body.part(field, value);
            }
        }
    }

    /** The poster file of a {@link PosterRequest}: a JPG, PNG or MP4 of at most 20 MB. */
    public record Upload(String filename, String contentType, byte[] data) {
    }

    /** Aurora's answer to a created poster request. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreatedPosterRequest(long id, String createdAt) {
    }
}
