package cafe.community.backend.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The production Sentry release comes from Maven resource filtering. A token such as
 * {@code name@@project.version@} is not substituted and ships as literal text, so every backend
 * event lands in a bogus release. Reads the filtered file from the test classpath to catch that.
 */
class SentryReleaseFilteringTest {

    @Test
    void productionReleaseIsTheProjectNameAndVersion() throws IOException {
        Properties props = new Properties();
        try (InputStream in = getClass().getResourceAsStream("/application-prod.properties")) {
            assertThat(in).isNotNull();
            props.load(in);
        }

        assertThat(props.getProperty("sentry.release")).matches("community-cafe-backend@\\d+\\.\\d+\\.\\d+.*");
    }
}
