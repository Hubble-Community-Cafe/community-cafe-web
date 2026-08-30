package cafe.community.backend.controller;

import cafe.community.backend.dto.RootStatusDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RootControllerTest {

    @Autowired MockMvc mockMvc;

    @Test
    void root_isPublicAndReportsUptime() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("community-cafe-backend"))
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.startedAt").exists())
                .andExpect(jsonPath("$.uptimeSeconds").isNumber());
    }

    @Test
    void uptime_growsFromTheStartupInstant() {
        Instant start = Instant.parse("2026-08-30T10:00:00Z");
        MutableClock clock = new MutableClock(start);
        RootController controller = new RootController(clock);

        assertThat(controller.root().uptimeSeconds()).isZero();

        clock.advance(Duration.ofSeconds(42));
        RootStatusDto later = controller.root();
        assertThat(later.startedAt()).isEqualTo(start);
        assertThat(later.uptimeSeconds()).isEqualTo(42);
    }

    /** A clock the test can move forward, so uptime does not depend on wall-clock timing. */
    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration amount) {
            now = now.plus(amount);
        }

        @Override public Instant instant() { return now; }
        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
    }
}
