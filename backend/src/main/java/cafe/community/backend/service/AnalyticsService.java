package cafe.community.backend.service;

import cafe.community.backend.model.BarLocation;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;

/**
 * PII-free page-view analytics. Emits one line per served content page to the dedicated
 * APP_ANALYTICS logger, carrying only the page name and the derived site (hubble/meteor/unknown).
 * No IP address, identifier, cookie or free text is logged. Add a page by calling
 * {@link #logPageView} from the relevant public controller.
 */
@Service
public class AnalyticsService {

    private static final Logger analytics = LoggerFactory.getLogger("APP_ANALYTICS");

    /** Page view where the site can only come from the request headers (no bar in scope). */
    public void logPageView(String page, HttpServletRequest request) {
        logPageView(page, request, null);
    }

    /**
     * Page view for a bar-scoped page: the site is derived from the Origin (then Referer) host,
     * falling back to the requested {@link BarLocation} when neither header identifies a known site.
     */
    public void logPageView(String page, HttpServletRequest request, BarLocation barFallback) {
        analytics.info("APP_ANALYTICS event=page_view page={} site={}", page, site(request, barFallback));
    }

    private String site(HttpServletRequest request, BarLocation barFallback) {
        String host = hostOf(request.getHeader("Origin"));
        if (host == null) {
            host = hostOf(request.getHeader("Referer"));
        }
        if (host != null) {
            String h = host.toLowerCase();
            if (matches(h, "hubble.cafe")) return "hubble";
            if (matches(h, "meteor.cafe")) return "meteor";
        }
        if (barFallback == BarLocation.HUBBLE) return "hubble";
        if (barFallback == BarLocation.METEOR) return "meteor";
        return "unknown";
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
