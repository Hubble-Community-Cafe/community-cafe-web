package cafe.community.backend.aurora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Current state of Aurora's static poster handler. {@code activePoster} is null when no poster
 * is being shown.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuroraStaticPosterState(
        AuroraPoster activePoster,
        boolean clockVisible
) {
}
