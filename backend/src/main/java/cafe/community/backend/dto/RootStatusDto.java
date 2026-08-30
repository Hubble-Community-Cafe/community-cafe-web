package cafe.community.backend.dto;

import java.time.Instant;

/**
 * Public landing/liveness payload for {@code GET /}. {@code startedAt} and {@code uptimeSeconds}
 * let the public sites tell a deploy restart apart from a genuine failure when a content fetch
 * fails: a short uptime means the backend has only just come back.
 */
public record RootStatusDto(
        String service,
        String status,
        String docs,
        Instant startedAt,
        long uptimeSeconds
) {
}
