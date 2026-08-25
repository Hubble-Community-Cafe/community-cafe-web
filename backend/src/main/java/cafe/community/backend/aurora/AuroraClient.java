package cafe.community.backend.aurora;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Thin transport layer over the Aurora narrowcasting API. Knows how to make the calls and how to
 * fail cleanly; it holds no opinion about what a "scene" is.
 *
 * <p>Authentication is an integration user's key in the {@code x-api-key} header. That key is
 * scoped in Aurora to exactly the operations used here: {@code getScreenHandlers},
 * {@code setScreenHandler} and {@code showStaticPoster}. The poster read endpoints come along with
 * the {@code integration-user} group.
 */
@Component
public class AuroraClient {

    private static final Logger log = LoggerFactory.getLogger(AuroraClient.class);

    private static final ParameterizedTypeReference<List<AuroraScreenHandler>> SCREEN_HANDLER_LIST =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<List<AuroraPoster>> POSTER_LIST =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final boolean enabled;
    private final String baseUrl;

    public AuroraClient(
            RestClient auroraRestClient,
            @Value("${app.aurora.enabled:false}") boolean enabled,
            @Value("${app.aurora.base-url:}") String baseUrl,
            @Value("${app.aurora.api-key:}") String apiKey) {
        this.restClient = auroraRestClient;
        this.baseUrl = baseUrl;
        this.enabled = enabled && !baseUrl.isBlank() && !apiKey.isBlank();

        if (enabled && !this.enabled) {
            log.warn("Aurora is enabled but app.aurora.base-url or app.aurora.api-key is blank; "
                    + "the screen scene panel will stay unavailable.");
        } else if (this.enabled) {
            log.info("Aurora client configured for {}", baseUrl);
        }
    }

    /**
     * Whether Aurora is configured at all. False in local dev and in the e2e stack unless wired up,
     * which lets the admin show a clear "not configured" state instead of failing calls.
     */
    public boolean isEnabled() {
        return enabled;
    }

    public String baseUrl() {
        return baseUrl;
    }

    /** All screen handlers and the screens currently attached to each. */
    public List<AuroraScreenHandler> getScreenHandlers() {
        List<AuroraScreenHandler> handlers = call("GET /handler/screen", () -> restClient.get()
                .uri("/handler/screen")
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::fail)
                .body(SCREEN_HANDLER_LIST));
        return handlers == null ? List.of() : handlers;
    }

    /**
     * Every screen Aurora knows about, flattened across all handlers and de-duplicated by id.
     * Aurora exposes no plain screen list to an integration user, so this is the way to enumerate
     * them.
     */
    public List<AuroraScreen> getScreens() {
        List<AuroraScreenHandler> handlers = getScreenHandlers();
        Map<Long, AuroraScreen> byId = new LinkedHashMap<>();
        for (AuroraScreenHandler handler : handlers) {
            if (handler.entities() == null) {
                continue;
            }
            for (AuroraScreen screen : handler.entities()) {
                byId.putIfAbsent(screen.id(), screen);
            }
        }
        return new ArrayList<>(byId.values());
    }

    /**
     * Move one screen onto the named handler. Aurora matches {@code handlerName} against the
     * handler's class name and answers 400 if it does not resolve.
     */
    public void setScreenHandler(long screenId, String handlerName) {
        call("POST /handler/screen/" + screenId, () -> restClient.post()
                .uri("/handler/screen/{id}", screenId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("name", handlerName))
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::fail)
                .toBodilessEntity());
    }

    /** All static posters available to show. */
    public List<AuroraPoster> getStaticPosters() {
        List<AuroraPoster> posters = call("GET /handler/screen/poster/static/items", () -> restClient.get()
                .uri("/handler/screen/poster/static/items")
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::fail)
                .body(POSTER_LIST));
        return posters == null ? List.of() : posters;
    }

    /** Which poster the static handler is currently showing, if any. */
    public AuroraStaticPosterState getStaticPosterState() {
        AuroraStaticPosterState state = call("GET /handler/screen/poster/static", () -> restClient.get()
                .uri("/handler/screen/poster/static")
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::fail)
                .body(AuroraStaticPosterState.class));
        if (state == null) {
            throw new AuroraException("Aurora returned an empty static poster state.");
        }
        return state;
    }

    /**
     * Set the active poster on the static poster handler. This only reaches screens already
     * attached to that handler, so callers move the screens first.
     */
    public void showStaticPoster(long posterId) {
        call("POST /handler/screen/poster/static/items/" + posterId + "/show", () -> restClient.post()
                .uri("/handler/screen/poster/static/items/{id}/show", posterId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::fail)
                .toBodilessEntity());
    }

    private <T> T call(String description, Supplier<T> request) {
        if (!enabled) {
            throw new AuroraException("Aurora is not configured.");
        }
        try {
            return request.get();
        } catch (AuroraException e) {
            throw e;
        } catch (RestClientException e) {
            log.warn("Aurora call failed: {}", description, e);
            throw new AuroraException("Could not reach Aurora (" + description + "): " + e.getMessage(), e);
        }
    }

    /** Turns a non-2xx Aurora response into an {@link AuroraException} carrying its body. */
    private void fail(HttpRequest request, ClientHttpResponse response) throws IOException {
        HttpStatusCode status = response.getStatusCode();
        String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        String detail = body.isBlank() ? "" : ": " + body;
        throw new AuroraException("Aurora returned " + status.value() + detail);
    }
}
