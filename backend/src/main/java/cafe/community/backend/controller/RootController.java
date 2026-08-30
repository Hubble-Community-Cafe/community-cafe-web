package cafe.community.backend.controller;

import cafe.community.backend.dto.RootStatusDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * A small unauthenticated landing endpoint so the root URL is not a 401/404.
 *
 * <p>The public sites also probe it when a content fetch fails: the reported uptime tells their
 * browser-side error reporter whether the backend has just restarted (an expected deploy blip,
 * not worth a Sentry issue) or has been up all along (so the failure is client-side and worth
 * reporting). Keep it cheap: no database access, no authentication.
 */
@RestController
public class RootController {

    private final Clock clock;
    private final Instant startedAt;

    public RootController() {
        this(Clock.systemUTC());
    }

    /** Package-private: lets tests pin the clock so uptime is deterministic. */
    RootController(Clock clock) {
        this.clock = clock;
        this.startedAt = clock.instant();
    }

    @GetMapping("/")
    public RootStatusDto root() {
        return new RootStatusDto(
                "community-cafe-backend",
                "ok",
                "/swagger-ui.html",
                startedAt,
                Duration.between(startedAt, clock.instant()).toSeconds());
    }
}
