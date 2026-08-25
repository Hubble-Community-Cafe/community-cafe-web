package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * One screen handler and the screens currently attached to it, as returned by
 * {@code GET /handler/screen}.
 *
 * <p>{@code name} is Aurora's handler class name (for example {@code StaticPosterHandler}), which
 * is also the value {@code POST /handler/screen/{id}} expects. {@code id} is a per-process UUID,
 * not a stable identifier, so we never key on it.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuroraScreenHandler(
        String id,
        String name,
        List<AuroraScreen> entities
) {
}
