package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** The stored file behind a static poster. {@code name} is the original upload filename. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuroraFile(
        String location,
        String name
) {
}
