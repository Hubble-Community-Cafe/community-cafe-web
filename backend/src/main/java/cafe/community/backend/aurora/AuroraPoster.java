package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A static poster, as returned by {@code GET /handler/screen/poster/static/items}.
 *
 * <p>Aurora gives static posters no human-readable name of their own, so a scene is pinned to a
 * poster by {@code id} and the admin picker labels it with {@code file.name} or {@code uri}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuroraPoster(
        long id,
        String createdAt,
        String updatedAt,
        AuroraFile file,
        String uri
) {

    /** Best available label for this poster, since Aurora stores no name. */
    public String label() {
        if (file != null && file.name() != null && !file.name().isBlank()) {
            return file.name();
        }
        if (uri != null && !uri.isBlank()) {
            return uri;
        }
        return "Poster " + id;
    }
}
