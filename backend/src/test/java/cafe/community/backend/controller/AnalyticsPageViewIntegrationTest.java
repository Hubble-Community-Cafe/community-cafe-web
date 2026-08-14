package cafe.community.backend.controller;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the public content controllers actually emit the page-view analytics line. Bar
 * derivation is driven here via the Referer header (the CORS filter would reject a cross-site
 * Origin before the controller runs); the full Origin/Referer/bar matrix is in AnalyticsServiceTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AnalyticsPageViewIntegrationTest {

    @Autowired MockMvc mockMvc;

    private Logger analyticsLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        analyticsLogger = (Logger) LoggerFactory.getLogger("APP_ANALYTICS");
        appender = new ListAppender<>();
        appender.start();
        analyticsLogger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        analyticsLogger.detachAppender(appender);
    }

    private List<String> lines() {
        return appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    @Test
    void barScopedEndpoint_derivesBarFromReferer() throws Exception {
        mockMvc.perform(get("/api/menu/HUBBLE").header("Referer", "https://meteor.cafe/menu"))
                .andExpect(status().isOk());
        assertThat(lines()).containsExactly("APP_ANALYTICS event=page_view page=menu bar=METEOR");
    }

    @Test
    void barScopedEndpoint_fallsBackToBarWhenNoHeaders() throws Exception {
        mockMvc.perform(get("/api/menu/HUBBLE")).andExpect(status().isOk());
        assertThat(lines()).containsExactly("APP_ANALYTICS event=page_view page=menu bar=HUBBLE");
    }

    @Test
    void sharedBoardEndpoint_derivesBarFromReferer() throws Exception {
        mockMvc.perform(get("/api/board").header("Referer", "https://hubble.cafe/community/board"))
                .andExpect(status().isOk());
        assertThat(lines()).containsExactly("APP_ANALYTICS event=page_view page=board bar=HUBBLE");
    }

    @Test
    void adminEndpointIsNotInstrumented() throws Exception {
        // Admin endpoints are intentionally not analytics-instrumented (and require auth).
        mockMvc.perform(get("/api/admin/vacancies"));
        assertThat(lines()).isEmpty();
    }
}
