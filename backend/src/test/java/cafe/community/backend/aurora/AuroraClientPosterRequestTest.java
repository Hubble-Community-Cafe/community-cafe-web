package cafe.community.backend.aurora;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.RequestMatcher;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Pins the poster request contract with Aurora: the multipart fields, the file part, the key
 * header, and how each error status is classified (refused content versus Aurora being unusable).
 */
class AuroraClientPosterRequestTest {

    private static final String BASE = "https://aurora.test";
    private static final String API_KEY = "test-key";
    private static final String URL = BASE + "/api/handler/screen/poster/requests";
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G'};

    private MockRestServiceServer server;
    private MockRestServiceServer uploadServer;
    private AuroraClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        RestClient.Builder uploadBuilder = RestClient.builder();
        uploadServer = MockRestServiceServer.bindTo(uploadBuilder).build();
        client = new AuroraClient(
                builder.baseUrl(BASE + "/api").defaultHeader("x-api-key", API_KEY).build(),
                uploadBuilder.baseUrl(BASE + "/api").defaultHeader("x-api-key", API_KEY).build(),
                true, BASE, API_KEY);
    }

    private static Aurora.PosterRequest dated() {
        return new Aurora.PosterRequest("Anke", "anke@x.com", "Doppio", "Please post",
                "Doppio: 2026-07-01 to 2026-07-15", null,
                OffsetDateTime.parse("2026-07-01T00:00+02:00"),
                OffsetDateTime.parse("2026-07-16T00:00+02:00"),
                "#FFF200", 30, new Aurora.Upload("poster.png", "image/png", PNG));
    }

    private static Aurora.PosterRequest minimal() {
        return new Aurora.PosterRequest("Anke", "anke@x.com", null, null, "Doppio: permanent",
                null, null, null, null, null, new Aurora.Upload("clip.mp4", "video/mp4", PNG));
    }

    /** The raw multipart body, to check the file part headers and fields that must be absent. */
    private static RequestMatcher body(java.util.function.Consumer<String> check) {
        return request -> check.accept(
                ((MockClientHttpRequest) request).getBodyAsString(StandardCharsets.UTF_8));
    }

    @Test
    void postsMultipartWithEveryFieldOnTheUploadClient() {
        uploadServer.expect(requestTo(URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-api-key", API_KEY))
                .andExpect(content().contentTypeCompatibleWith(MediaType.MULTIPART_FORM_DATA))
                .andExpect(content().multipartDataContains(Map.of(
                        "requesterName", "Anke",
                        "requesterEmail", "anke@x.com",
                        "requesterAssociation", "Doppio",
                        "message", "Please post",
                        "name", "Doppio: 2026-07-01 to 2026-07-15",
                        "startDate", "2026-07-01T00:00+02:00",
                        "expirationDate", "2026-07-16T00:00+02:00",
                        "accentColor", "#FFF200",
                        "defaultTimeout", "30")))
                .andExpect(body(b -> assertThat(b)
                        .contains("name=\"file\"; filename=\"poster.png\"")
                        .contains("Content-Type: image/png")
                        .doesNotContain("name=\"label\"")
                        .doesNotContain("name=\"uri\"")
                        .doesNotContain("name=\"footerSize\"")))
                .andRespond(withSuccess("{\"id\":7,\"createdAt\":\"2026-10-07T10:00:00.000Z\",\"extra\":1}",
                        MediaType.APPLICATION_JSON));

        Aurora.CreatedPosterRequest created = client.createPosterRequest(dated());

        assertThat(created.id()).isEqualTo(7L);
        assertThat(created.createdAt()).isEqualTo("2026-10-07T10:00:00.000Z");
        uploadServer.verify();
        server.verify();
    }

    @Test
    void leavesOutOptionalFieldsThatAreNotSet() {
        uploadServer.expect(requestTo(URL))
                .andExpect(content().multipartDataContains(Map.of(
                        "requesterName", "Anke", "requesterEmail", "anke@x.com", "name", "Doppio: permanent")))
                .andExpect(body(b -> assertThat(b)
                        .contains("filename=\"clip.mp4\"")
                        .contains("Content-Type: video/mp4")
                        .doesNotContain("name=\"requesterAssociation\"")
                        .doesNotContain("name=\"message\"")
                        .doesNotContain("name=\"startDate\"")
                        .doesNotContain("name=\"expirationDate\"")
                        .doesNotContain("name=\"accentColor\"")
                        .doesNotContain("name=\"defaultTimeout\"")))
                .andRespond(withSuccess("{\"id\":8,\"createdAt\":\"2026-10-07T10:00:00.000Z\"}",
                        MediaType.APPLICATION_JSON));

        assertThat(client.createPosterRequest(minimal()).id()).isEqualTo(8L);
        uploadServer.verify();
    }

    @ParameterizedTest
    @CsvSource({
            "400, INVALID",
            "413, TOO_LARGE",
            "415, UNSUPPORTED_FILE",
    })
    void refusedContent_isARejection(int status, AuroraRejectedException.Reason reason) {
        uploadServer.expect(requestTo(URL))
                .andRespond(withStatus(HttpStatus.valueOf(status))
                        .body("{\"name\":\"HttpApiException\",\"message\":\"Field \\\"name\\\" is required.\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.createPosterRequest(dated()))
                .isInstanceOfSatisfying(AuroraRejectedException.class,
                        e -> assertThat(e.reason()).isEqualTo(reason))
                .hasMessageContaining(String.valueOf(status));
        uploadServer.verify();
    }

    /** Our own setup or Aurora's state, not the requester's content: callers fall back to email. */
    @ParameterizedTest
    @ValueSource(ints = {401, 403, 409, 500, 502, 503})
    void otherErrors_areAPlainAuroraException(int status) {
        uploadServer.expect(requestTo(URL))
                .andRespond(withStatus(HttpStatus.valueOf(status))
                        .body("Endpoint is disabled by setting \"Poster.Requests\"")
                        .contentType(MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> client.createPosterRequest(dated()))
                .isInstanceOf(AuroraException.class)
                .isNotInstanceOf(AuroraRejectedException.class)
                .hasMessageContaining(String.valueOf(status));
        uploadServer.verify();
    }

    @Test
    void timeout_isAPlainAuroraException() {
        uploadServer.expect(requestTo(URL))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.createPosterRequest(dated()))
                .isInstanceOf(AuroraException.class)
                .isNotInstanceOf(AuroraRejectedException.class)
                .hasMessageContaining("Could not reach Aurora");
    }

    @Test
    void emptyResponse_isAnAuroraException() {
        uploadServer.expect(requestTo(URL)).andRespond(withSuccess());

        assertThatThrownBy(() -> client.createPosterRequest(dated()))
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void disabledClient_failsWithoutCallingAurora() {
        AuroraClient off = new AuroraClient(RestClient.builder().build(), false, BASE, API_KEY);

        assertThatThrownBy(() -> off.createPosterRequest(dated()))
                .isInstanceOf(AuroraException.class)
                .isNotInstanceOf(AuroraRejectedException.class)
                .hasMessageContaining("not configured");
    }
}
