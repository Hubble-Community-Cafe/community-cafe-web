package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A screen entity as Aurora reports it. Mirrors Aurora's {@code ScreenResponse}, trimmed to the
 * fields we use. Unknown fields are ignored because this is an external API we do not control.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuroraScreen(
        long id,
        String name
) {
}
