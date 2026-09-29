package cafe.community.backend.mail;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Starts the whole application with the production mail provider (Microsoft Graph). The other tests
 * and the e2e stack use the log or SMTP provider, so without this a bean that only exists with
 * `app.mail.provider=graph` could break production startup unnoticed (as happened when a second,
 * test-only constructor made Spring unable to choose). Building the Graph client makes no network
 * call, so dummy credentials are enough.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.mail.provider=graph",
        "app.mail.graph.tenant-id=00000000-0000-0000-0000-000000000000",
        "app.mail.graph.client-id=00000000-0000-0000-0000-000000000001",
        "app.mail.graph.client-secret=not-a-real-secret",
})
class GraphMailProviderContextTest {

    @Autowired FormMailService formMailService;

    @Test
    void theApplicationStartsWithGraphMailAndUsesIt() {
        assertThat(formMailService).isInstanceOf(GraphFormMailService.class);
    }
}
