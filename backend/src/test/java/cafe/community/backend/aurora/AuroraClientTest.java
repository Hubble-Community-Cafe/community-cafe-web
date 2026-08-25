package cafe.community.backend.aurora;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withNoContent;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Pins the wire contract with Aurora: exact paths under /api, the x-api-key header, and the
 * request body shape. These are the details that silently break a scene switch if they drift.
 */
class AuroraClientTest {

    private static final String BASE = "https://aurora.test";
    private static final String API_KEY = "test-key";

    private MockRestServiceServer server;
    private AuroraClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder
                .baseUrl(BASE + "/api")
                .defaultHeader("x-api-key", API_KEY)
                .build();
        client = new AuroraClient(restClient, true, BASE, API_KEY);
    }

    @Test
    void isEnabled_whenBaseUrlAndKeyPresent() {
        assertThat(client.isEnabled()).isTrue();
    }

    @Test
    void isDisabled_whenApiKeyMissing() {
        AuroraClient unconfigured = new AuroraClient(RestClient.builder().build(), true, BASE, "");
        assertThat(unconfigured.isEnabled()).isFalse();
    }

    @Test
    void isDisabled_whenFlagOff() {
        AuroraClient off = new AuroraClient(RestClient.builder().build(), false, BASE, API_KEY);
        assertThat(off.isEnabled()).isFalse();
    }

    @Test
    void disabledClient_failsWithoutCallingAurora() {
        AuroraClient off = new AuroraClient(RestClient.builder().build(), false, BASE, API_KEY);
        assertThatThrownBy(off::getScreenHandlers)
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    void getScreenHandlers_sendsApiKeyAndParsesResponse() {
        server.expect(requestTo(BASE + "/api/handler/screen"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(header("x-api-key", API_KEY))
                .andRespond(withSuccess("""
                        [
                          {"id":"uuid-1","name":"CarouselPosterHandler","entities":[
                            {"id":1,"name":"Bar screen","scaleFactor":1}
                          ]},
                          {"id":"uuid-2","name":"StaticPosterHandler","entities":[]}
                        ]
                        """, MediaType.APPLICATION_JSON));

        List<AuroraScreenHandler> handlers = client.getScreenHandlers();

        assertThat(handlers).hasSize(2);
        assertThat(handlers.get(0).name()).isEqualTo("CarouselPosterHandler");
        assertThat(handlers.get(0).entities()).singleElement()
                .satisfies(screen -> {
                    assertThat(screen.id()).isEqualTo(1L);
                    assertThat(screen.name()).isEqualTo("Bar screen");
                });
        server.verify();
    }

    @Test
    void getScreens_flattensAcrossHandlersAndDeduplicates() {
        server.expect(requestTo(BASE + "/api/handler/screen"))
                .andRespond(withSuccess("""
                        [
                          {"id":"uuid-1","name":"CarouselPosterHandler","entities":[
                            {"id":1,"name":"Bar"},{"id":2,"name":"Hall"}
                          ]},
                          {"id":"uuid-2","name":"StaticPosterHandler","entities":[
                            {"id":2,"name":"Hall"},{"id":3,"name":"Kitchen"}
                          ]}
                        ]
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getScreens())
                .extracting(AuroraScreen::id)
                .containsExactly(1L, 2L, 3L);
        server.verify();
    }

    @Test
    void getScreens_toleratesNullEntities() {
        server.expect(requestTo(BASE + "/api/handler/screen"))
                .andRespond(withSuccess("""
                        [{"id":"uuid-1","name":"CenturionScreenHandler"}]
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getScreens()).isEmpty();
        server.verify();
    }

    @Test
    void setScreenHandler_postsHandlerNameAsJson() {
        server.expect(requestTo(BASE + "/api/handler/screen/7"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-api-key", API_KEY))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"name\":\"StaticPosterHandler\"}"))
                .andRespond(withNoContent());

        client.setScreenHandler(7, "StaticPosterHandler");
        server.verify();
    }

    @Test
    void showStaticPoster_postsToShowEndpoint() {
        server.expect(requestTo(BASE + "/api/handler/screen/poster/static/items/3/show"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-api-key", API_KEY))
                .andRespond(withNoContent());

        client.showStaticPoster(3);
        server.verify();
    }

    @Test
    void getStaticPosters_parsesLabelFallbacks() {
        server.expect(requestTo(BASE + "/api/handler/screen/poster/static/items"))
                .andRespond(withSuccess("""
                        [
                          {"id":3,"createdAt":"2026-01-01","updatedAt":"2026-01-01",
                           "file":{"location":"local-posters/closed.png","name":"closed.png"}},
                          {"id":4,"createdAt":"2026-01-01","updatedAt":"2026-01-01",
                           "uri":"https://example.test/last-call"},
                          {"id":5,"createdAt":"2026-01-01","updatedAt":"2026-01-01"}
                        ]
                        """, MediaType.APPLICATION_JSON));

        List<AuroraPoster> posters = client.getStaticPosters();

        assertThat(posters).extracting(AuroraPoster::label)
                .containsExactly("closed.png", "https://example.test/last-call", "Poster 5");
        server.verify();
    }

    @Test
    void getStaticPosterState_parsesNullActivePoster() {
        server.expect(requestTo(BASE + "/api/handler/screen/poster/static"))
                .andRespond(withSuccess("""
                        {"activePoster":null,"clockVisible":true}
                        """, MediaType.APPLICATION_JSON));

        AuroraStaticPosterState state = client.getStaticPosterState();

        assertThat(state.activePoster()).isNull();
        assertThat(state.clockVisible()).isTrue();
        server.verify();
    }

    @Test
    void errorResponse_becomesAuroraExceptionWithBody() {
        server.expect(requestTo(BASE + "/api/handler/screen/9"))
                .andRespond(withStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
                        .body("{\"message\":\"Bad Request\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.setScreenHandler(9, "NoSuchHandler"))
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("Bad Request");
        server.verify();
    }

    @Test
    void serverError_becomesAuroraException() {
        server.expect(requestTo(BASE + "/api/handler/screen"))
                .andRespond(withServerError());

        assertThatThrownBy(client::getScreenHandlers)
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("500");
        server.verify();
    }

    @Test
    void unknownJsonFields_areIgnored() {
        server.expect(requestTo(BASE + "/api/handler/screen"))
                .andRespond(withSuccess("""
                        [{"id":"uuid-1","name":"CarouselPosterHandler","somethingNew":42,
                          "entities":[{"id":1,"name":"Bar","socketIds":{"/":"abc"},"scaleFactor":1.5}]}]
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.getScreens()).extracting(AuroraScreen::name).containsExactly("Bar");
        server.verify();
    }
}
