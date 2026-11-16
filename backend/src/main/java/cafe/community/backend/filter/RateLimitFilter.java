package cafe.community.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting for the public form endpoints: at most {@value #MAX_PER_MINUTE}
 * POSTs per minute to {@code /api/forms/**}, to blunt spam and abuse without cookies or a
 * third-party captcha. In-memory and best-effort (single instance). The client is keyed on
 * {@code X-Real-IP} only when the direct peer is the reverse proxy (a loopback or private
 * address); from any other peer the header is client-controlled, so a fresh value per request
 * would sidestep the limit, and the peer address is used instead.
 */
// Disabled under test and e2e: the per-IP counter is process-wide and is not cleared by the
// e2e reset, so leaving it on would couple otherwise-independent form specs together.
@Component
@Profile("!test & !e2e")
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final int MAX_PER_MINUTE = 10;
    private static final long WINDOW_MS = 60_000;
    private static final long CLEANUP_INTERVAL_MS = 5 * 60_000;
    /** Above this many tracked clients, expired entries are purged early (at most once a second). */
    static final int MAX_TRACKED_CLIENTS = 10_000;
    private static final long FORCED_CLEANUP_INTERVAL_MS = 1_000;
    private static final String PATH_PREFIX = "/api/forms/";

    private final ConcurrentHashMap<String, List<Long>> hits = new ConcurrentHashMap<>();
    private final Clock clock;
    private volatile long lastCleanup;

    public RateLimitFilter() {
        this(Clock.systemUTC());
    }

    /** Package-private: lets tests drive the sliding window with a controllable clock. */
    RateLimitFilter(Clock clock) {
        this.clock = clock;
        this.lastCleanup = clock.millis();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().startsWith(PATH_PREFIX)
                && isRateLimited(clientIp(request))) {
            log.warn("Rate limit exceeded for IP {} on {}", clientIp(request), request.getRequestURI());
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please try again later.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isRateLimited(String ip) {
        long now = clock.millis();
        cleanupIfNeeded(now);
        List<Long> timestamps = hits.computeIfAbsent(ip, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (timestamps) {
            timestamps.removeIf(t -> now - t > WINDOW_MS);
            if (timestamps.size() >= MAX_PER_MINUTE) {
                return true;
            }
            timestamps.add(now);
            return false;
        }
    }

    private void cleanupIfNeeded(long now) {
        boolean overCap = hits.size() > MAX_TRACKED_CLIENTS && now - lastCleanup > FORCED_CLEANUP_INTERVAL_MS;
        if (now - lastCleanup > CLEANUP_INTERVAL_MS || overCap) {
            lastCleanup = now;
            hits.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    e.getValue().removeIf(t -> now - t > WINDOW_MS);
                    return e.getValue().isEmpty();
                }
            });
        }
    }

    /** Package-private: lets tests check how many clients are tracked. */
    int trackedClients() {
        return hits.size();
    }

    private String clientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && isTrustedProxy(remoteAddr)) {
            return realIp.trim();
        }
        return remoteAddr;
    }

    static boolean isTrustedProxy(String remoteAddr) {
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return false;
        }
        InetAddress address;
        try {
            // ofLiteral never does a DNS lookup; anything that is not an IP literal is untrusted.
            address = InetAddress.ofLiteral(remoteAddr.trim());
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (address.isLoopbackAddress() || address.isSiteLocalAddress()) {
            return true;
        }
        // IPv6 unique local addresses (fc00::/7), the IPv6 counterpart of private networks.
        return address instanceof Inet6Address && (address.getAddress()[0] & 0xFE) == 0xFC;
    }
}
