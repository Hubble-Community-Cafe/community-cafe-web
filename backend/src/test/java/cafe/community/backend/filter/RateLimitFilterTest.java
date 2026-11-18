package cafe.community.backend.filter;

import cafe.community.backend.MutableClock;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

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

    /** The Docker bridge gateway: what the backend sees when the proxy uses the published port. */
    private static final String PROXY = "172.18.0.1";

    private final MutableClock clock = new MutableClock(Instant.parse("2026-06-21T12:00:00Z"));

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

    /** The client IP is personal data: the warning says which form was hit, not by whom. */
    @Test
    @ExtendWith(OutputCaptureExtension.class)
    void logsTheBlockWithoutTheClientIp(CapturedOutput output) throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 11; i++) {
            filter.doFilterInternal(post("/api/forms/complaint", "198.51.100.23"), new Captured().response, chain);
        }

        assertThat(output.getAll()).contains("Rate limit exceeded on /api/forms/complaint")
                .doesNotContain("198.51.100.23");
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

    @Test
    void ignoresXRealIpFromAPeerThatIsNotTheProxy() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        // Straight from the internet (not through the proxy), with a fresh X-Real-IP every time:
        // the header is ignored and all eleven count against the peer address.
        for (int i = 0; i < 10; i++) {
            filter.doFilterInternal(
                    request("POST", "/api/forms/complaint", "9.9.9." + i, "203.0.113.5"), new Captured().response, chain);
        }
        Captured blocked = new Captured();
        filter.doFilterInternal(
                request("POST", "/api/forms/complaint", "9.9.9.99", "203.0.113.5"), blocked.response, chain);

        verify(blocked.response).setStatus(429);
        verify(chain, times(10)).doFilter(any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "::1", "10.0.0.7", "172.18.0.1", "192.168.1.20", "fd12:3456::1"})
    void trustsLoopbackAndPrivatePeersAsTheProxy(String peer) {
        assertThat(RateLimitFilter.isTrustedProxy(peer)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"203.0.113.5", "8.8.8.8", "2001:db8::1", "0.0.0.0", "not-an-ip", "localhost"})
    void doesNotTrustPublicOrMalformedPeers(String peer) {
        assertThat(RateLimitFilter.isTrustedProxy(peer)).isFalse();
    }

    @Test
    void purgesExpiredClientsEarlyOnceTheMapIsOverTheCap() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        int clients = RateLimitFilter.MAX_TRACKED_CLIENTS + 1;
        for (int i = 0; i < clients; i++) {
            filter.doFilterInternal(formPost("10." + (i >> 16) + "." + ((i >> 8) & 0xFF) + "." + (i & 0xFF)),
                    new MockHttpServletResponse(), chain);
        }
        assertThat(filter.trackedClients()).isEqualTo(clients);

        // Well inside the regular five-minute cleanup interval, but past the 60s window: being
        // over the cap triggers an early purge, leaving only the newest client.
        clock.advance(Duration.ofSeconds(62));
        filter.doFilterInternal(formPost("1.2.3.4"), new MockHttpServletResponse(), chain);

        assertThat(filter.trackedClients()).isEqualTo(1);
    }

    @Test
    void keepsExpiredClientsUntilTheRegularCleanupWhenUnderTheCap() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(clock);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(formPost("5.5.5.5"), new MockHttpServletResponse(), chain);
        clock.advance(Duration.ofSeconds(62));
        filter.doFilterInternal(formPost("6.6.6.6"), new MockHttpServletResponse(), chain);

        assertThat(filter.trackedClients()).isEqualTo(2);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private HttpServletRequest post(String uri, String ip) {
        return request("POST", uri, ip);
    }

    /** A request that came through the reverse proxy, which reports the client in X-Real-IP. */
    private HttpServletRequest request(String method, String uri, String ip) {
        return request(method, uri, ip, PROXY);
    }

    private HttpServletRequest request(String method, String uri, String realIp, String peer) {
        HttpServletRequest r = mock(HttpServletRequest.class);
        when(r.getMethod()).thenReturn(method);
        when(r.getRequestURI()).thenReturn(uri);
        when(r.getHeader(eq("X-Real-IP"))).thenReturn(realIp);
        when(r.getRemoteAddr()).thenReturn(peer);
        return r;
    }

    /** A lightweight (non-Mockito) proxied form POST, for tests that send thousands. */
    private static MockHttpServletRequest formPost(String clientIp) {
        MockHttpServletRequest r = new MockHttpServletRequest("POST", "/api/forms/complaint");
        r.setRemoteAddr(PROXY);
        r.addHeader("X-Real-IP", clientIp);
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
}
