package cafe.community.backend.aurora;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * The HTTP client used to talk to Aurora.
 *
 * <p>Aurora is called server to server, never from the browser: its CORS configuration hardcodes
 * {@code allowedHeaders: ['Cookie', 'Cookies']} and sets no {@code Allow-Credentials}, so a
 * preflight carrying {@code content-type} or {@code x-api-key} is refused even from an origin
 * listed in its {@code CORS_ORIGINS}. That also keeps the API key out of the frontend.
 */
@Configuration
public class AuroraConfig {

    /** Aurora's API lives under /api on the configured host. */
    static final String API_PATH = "/api";

    @Bean
    RestClient auroraRestClient(
            @Value("${app.aurora.base-url:}") String baseUrl,
            @Value("${app.aurora.api-key:}") String apiKey,
            @Value("${app.aurora.timeout-ms:5000}") long timeoutMs) {

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        return RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(stripTrailingSlash(baseUrl) + API_PATH)
                .defaultHeader("x-api-key", apiKey)
                .build();
    }

    private static String stripTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
