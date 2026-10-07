package cafe.community.backend.aurora;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The e2e stand-in records accepted poster requests and can play Aurora down or refusing. */
class FakeAuroraClientPosterRequestTest {

    private final FakeAuroraClient fake = new FakeAuroraClient();

    private static Aurora.PosterRequest request(String name) {
        return new Aurora.PosterRequest("Anke", "anke@x.com", null, null, name, null, null, null,
                null, 30, new Aurora.Upload("poster.png", "image/png", new byte[]{1}));
    }

    @Test
    void acceptsAndRecordsRequestsInOrder() {
        assertThat(fake.createPosterRequest(request("first")).id()).isEqualTo(1L);
        assertThat(fake.createPosterRequest(request("second")).id()).isEqualTo(2L);

        assertThat(fake.posterRequests()).extracting(Aurora.PosterRequest::name)
                .containsExactly("first", "second");
    }

    @Test
    void downMode_failsLikeAnOutageAndRecordsNothing() {
        fake.setPosterRequestMode(FakeAuroraClient.PosterRequestMode.DOWN);

        assertThatThrownBy(() -> fake.createPosterRequest(request("x")))
                .isInstanceOf(AuroraException.class)
                .isNotInstanceOf(AuroraRejectedException.class);
        assertThat(fake.posterRequests()).isEmpty();
    }

    @Test
    void rejectFileMode_refusesTheFile() {
        fake.setPosterRequestMode(FakeAuroraClient.PosterRequestMode.REJECT_FILE);

        assertThatThrownBy(() -> fake.createPosterRequest(request("x")))
                .isInstanceOfSatisfying(AuroraRejectedException.class, e ->
                        assertThat(e.reason()).isEqualTo(AuroraRejectedException.Reason.UNSUPPORTED_FILE));
    }

    @Test
    void slowMode_acceptsAfterAPause() {
        fake.setPosterRequestMode(FakeAuroraClient.PosterRequestMode.SLOW);

        long started = System.nanoTime();
        fake.createPosterRequest(request("x"));

        assertThat((System.nanoTime() - started) / 1_000_000).isGreaterThanOrEqualTo(FakeAuroraClient.SLOW_MILLIS);
        assertThat(fake.posterRequests()).hasSize(1);
    }

    @Test
    void reset_clearsRequestsAndAcceptsAgain() {
        fake.createPosterRequest(request("x"));
        fake.setPosterRequestMode(FakeAuroraClient.PosterRequestMode.DOWN);

        fake.reset();

        assertThat(fake.posterRequests()).isEmpty();
        assertThat(fake.createPosterRequest(request("y")).id()).isEqualTo(1L);
    }
}
