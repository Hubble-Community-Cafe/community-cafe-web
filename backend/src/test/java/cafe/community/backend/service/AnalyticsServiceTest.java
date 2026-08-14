package cafe.community.backend.service;

import cafe.community.backend.model.BarLocation;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

/** Verifies the PII-free page-view line format and the bar derivation from Origin/Referer/path. */
class AnalyticsServiceTest {

    private final AnalyticsService service = new AnalyticsService();
    private Logger analyticsLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        analyticsLogger = (Logger) LoggerFactory.getLogger("APP_ANALYTICS");
        analyticsLogger.setLevel(Level.INFO);
        appender = new ListAppender<>();
        appender.start();
        analyticsLogger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        analyticsLogger.detachAppender(appender);
    }

    private String line() {
        assertThat(appender.list).hasSize(1);
        return appender.list.get(0).getFormattedMessage();
    }

    private MockHttpServletRequest req(String origin, String referer) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        if (origin != null) r.addHeader("Origin", origin);
        if (referer != null) r.addHeader("Referer", referer);
        return r;
    }

    @Test
    void emitsExactPageViewLine_hubbleFromOrigin() {
        service.logPageView("board", req("https://hubble.cafe", null));
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=board bar=HUBBLE");
    }

    @Test
    void meteorFromOrigin() {
        service.logPageView("menu", req("https://meteor.cafe", null));
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=menu bar=METEOR");
    }

    @Test
    void subdomainOriginMatches() {
        service.logPageView("events", req("https://test.hubble.cafe", null), BarLocation.METEOR);
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=events bar=HUBBLE");
    }

    @Test
    void originWinsOverBarFallback() {
        service.logPageView("menu", req("https://meteor.cafe", null), BarLocation.HUBBLE);
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=menu bar=METEOR");
    }

    @Test
    void fallsBackToRefererHostWhenNoOrigin() {
        service.logPageView("menu", req(null, "https://meteor.cafe/menu"), null);
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=menu bar=METEOR");
    }

    @Test
    void usesBarFallbackWhenNoHeaders() {
        service.logPageView("vacancies", req(null, null), BarLocation.HUBBLE);
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=vacancies bar=HUBBLE");
    }

    @Test
    void usesBarFallbackWhenOriginIsThirdParty() {
        service.logPageView("associations", req("https://example.com", null), BarLocation.METEOR);
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=associations bar=METEOR");
    }

    @Test
    void unknownWhenNoHeadersAndNoBar() {
        service.logPageView("board", req(null, null));
        assertThat(line()).isEqualTo("APP_ANALYTICS event=page_view page=board bar=UNKNOWN");
    }
}
