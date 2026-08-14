package cafe.community.backend.service;

import cafe.community.backend.model.BarLocation;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;

/**
 * PII-free page-view analytics. Emits one line per served content page to the dedicated
 * APP_ANALYTICS logger, carrying only the page name and the bar it was served for. No IP
 * address, identifier, cookie or free text is logged. Add a page by calling
 * {@link #logPageView} from the relevant public controller.
 *
 * <p>The {@code bar} key and its uppercase vocabulary are shared with the form events here and
 * with the reservation events in the-harry-list, so a single Grafana query can group every
 * analytics event by bar. Values used across both services: {@code HUBBLE}, {@code METEOR},
 * {@code BOTH} (screen posters), {@code NO_PREFERENCE} (reservations), {@code NONE} (the event
 * has no bar dimension) and {@code UNKNOWN} (the bar could not be determined).
 */
@Service
public class AnalyticsService {

    private static final Logger analytics = LoggerFactory.getLogger("APP_ANALYTICS");

    /** Page view where the bar can only come from the request headers (no bar in scope). */
    public void logPageView(String page, HttpServletRequest request) {
        logPageView(page, request, null);
    }

    /**
     * Page view for a bar-scoped page: the bar is derived from the Origin (then Referer) host,
     * falling back to the requested {@link BarLocation} when neither header identifies a known site.
     */
    public void logPageView(String page, HttpServletRequest request, BarLocation barFallback) {
        analytics.info("APP_ANALYTICS event=page_view page={} bar={}", page, bar(request, barFallback));
    }

    private String bar(HttpServletRequest request, BarLocation barFallback) {
        String host = hostOf(request.getHeader("Origin"));
        if (host == null) {
            host = hostOf(request.getHeader("Referer"));
        }
        if (host != null) {
            String h = host.toLowerCase();
            if (matches(h, "hubble.cafe")) return "HUBBLE";
            if (matches(h, "meteor.cafe")) return "METEOR";
        }
        if (barFallback == BarLocation.HUBBLE) return "HUBBLE";
        if (barFallback == BarLocation.METEOR) return "METEOR";
        return "UNKNOWN";
    }

    /** True when host is exactly the domain or a subdomain of it (so test.hubble.cafe matches). */
    private boolean matches(String host, String domain) {
        return host.equals(domain) || host.endsWith("." + domain);
    }

    /** Extracts the host from an Origin/Referer header value, or null if absent/unparseable. */
    private String hostOf(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        try {
            return URI.create(headerValue.trim()).getHost();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
