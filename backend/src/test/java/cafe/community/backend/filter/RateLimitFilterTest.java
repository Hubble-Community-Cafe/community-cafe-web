package cafe.community.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit-tests the filter directly (it is profile-excluded from the Spring context, and disabled in
 * e2e), driving the 60s window with a controllable clock so nothing has to sleep.
 */
class RateLimitFilterTest {

    private final TestClock clock = new TestClock(Instant.parse("2026-06-21T12:00:00Z"));

    @Test
    void allowsTenPostsThenBlocksTheEleventhWithJsonBody() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            Captured ok = new Captured();
            filter.doFilterInternal(post("/api/forms/complaint", "1.1.1.1"), ok.response, chain);
            verify(ok.response, never()).setStatus(429);
        }
        verify(chain, times(10)).doFilter(any(), any());

        Captured blocked = new Captured();
        filter.doFilterInternal(post("/api/forms/complaint", "1.1.1.1"), blocked.response, chain);

        verify(blocked.response).setStatus(429);
        verify(blocked.response).setContentType("application/json");
        assertThat(blocked.body.toString()).contains("RATE_LIMIT_EXCEEDED");
        // The blocked request never reaches the chain: still exactly ten pass-throughs.
        verify(chain, times(10)).doFilter(any(), any());
    }

    @Test
    void tracksEachIpSeparately() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            filter.doFilterInternal(post("/api/forms/complaint", "1.1.1.1"), new Captured().response, chain);
        }
        // 1.1.1.1 is exhausted, but a different IP starts from zero.
        Captured other = new Captured();
        filter.doFilterInternal(post("/api/forms/complaint", "2.2.2.2"), other.response, chain);

        verify(other.response, never()).setStatus(429);
        verify(chain, times(11)).doFilter(any(), any());
    }

    @Test
    void doesNotLimitNonPostOrNonFormRequests() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 25; i++) {
            filter.doFilterInternal(request("GET", "/api/forms/challenge", "1.1.1.1"), new Captured().response, chain);
            filter.doFilterInternal(request("POST", "/api/admin/menu/categories", "1.1.1.1"), new Captured().response, chain);
        }
        // None are rate-limited: all 50 pass through.
        verify(chain, times(50)).doFilter(any(), any());
    }

    @Test
    void slidesTheWindowSoOldHitsExpire() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            filter.doFilterInternal(post("/api/forms/complaint", "1.1.1.1"), new Captured().response, chain);
        }
        // Move just past the 60s window: the earlier hits drop out, so a new POST is allowed.
        clock.advance(Duration.ofSeconds(61));
        Captured afterWindow = new Captured();
        filter.doFilterInternal(post("/api/forms/complaint", "1.1.1.1"), afterWindow.response, chain);

        verify(afterWindow.response, never()).setStatus(429);
        verify(chain, times(11)).doFilter(any(), any());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private HttpServletRequest post(String uri, String ip) {
        return request("POST", uri, ip);
    }

    private HttpServletRequest request(String method, String uri, String ip) {
        HttpServletRequest r = mock(HttpServletRequest.class);
        when(r.getMethod()).thenReturn(method);
        when(r.getRequestURI()).thenReturn(uri);
        when(r.getHeader(eq("X-Real-IP"))).thenReturn(ip);
        when(r.getRemoteAddr()).thenReturn("0.0.0.0");
        return r;
    }

    /** A mock response whose writer captures the body the filter writes on a 429. */
    private static final class Captured {
        final HttpServletResponse response = mock(HttpServletResponse.class);
        final StringWriter body = new StringWriter();

        Captured() {
            try {
                when(response.getWriter()).thenReturn(new PrintWriter(body));
            } catch (IOException e) {
                throw new IllegalStateException(e);
            }
        }
    }

    /** A clock the test can advance by hand. */
    private static final class TestClock extends Clock {
        private Instant now;

        TestClock(Instant start) {
            this.now = start;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public long millis() {
            return now.toEpochMilli();
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
