package cafe.community.backend.service;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraRejectedException;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.mail.FormEmail;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PosterRequestMapperTest {

    private static final FormEmail.Attachment POSTER =
            new FormEmail.Attachment("poster.png", "image/png", new byte[]{1, 2, 3});

    private static ScreenRequest form() {
        ScreenRequest req = new ScreenRequest();
        req.setName(" Anke ");
        req.setAssociation(" Doppio ");
        req.setEmail(" anke@x.com ");
        req.setHexColor("#FFF200");
        req.setMessage(" Please post ");
        return req;
    }

    @Test
    void datedPoster_runsFromMidnightToMidnightAfterTheEndDayInAmsterdam() {
        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(form(),
                LocalDate.parse("2026-07-01"), LocalDate.parse("2026-07-15"), POSTER);

        assertThat(r.startDate()).isEqualTo(OffsetDateTime.parse("2026-07-01T00:00+02:00"));
        assertThat(r.expirationDate()).isEqualTo(OffsetDateTime.parse("2026-07-16T00:00+02:00"));
        assertThat(r.name()).isEqualTo("Doppio: 2026-07-01 to 2026-07-15");
    }

    /** The clocks go back on 2026-10-25, so the end carries winter time and the start summer time. */
    @Test
    void datedPoster_acrossTheDaylightSavingSwitch_usesEachDaysOwnOffset() {
        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(form(),
                LocalDate.parse("2026-10-20"), LocalDate.parse("2026-10-25"), POSTER);

        assertThat(r.startDate().toString()).isEqualTo("2026-10-20T00:00+02:00");
        assertThat(r.expirationDate().toString()).isEqualTo("2026-10-26T00:00+01:00");
    }

    @Test
    void singleDayPoster_stillExpiresAfterItStarts() {
        LocalDate day = LocalDate.parse("2026-12-05");
        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(form(), day, day, POSTER);

        assertThat(r.expirationDate()).isAfter(r.startDate());
        assertThat(r.expirationDate().toString()).isEqualTo("2026-12-06T00:00+01:00");
    }

    @Test
    void permanentPoster_hasNoDates() {
        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(form(), null, null, POSTER);

        assertThat(r.startDate()).isNull();
        assertThat(r.expirationDate()).isNull();
        assertThat(r.name()).isEqualTo("Doppio: permanent");
    }

    @Test
    void mapsRequesterFieldsAndAgreedDefaults() {
        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(form(), null, null, POSTER);

        assertThat(r.requesterName()).isEqualTo("Anke");
        assertThat(r.requesterEmail()).isEqualTo("anke@x.com");
        assertThat(r.requesterAssociation()).isEqualTo("Doppio");
        assertThat(r.message()).isEqualTo("Please post");
        assertThat(r.accentColor()).isEqualTo("#FFF200");
        assertThat(r.defaultTimeout()).isEqualTo(30);
        assertThat(r.label()).isNull();
        assertThat(r.file().filename()).isEqualTo("poster.png");
        assertThat(r.file().contentType()).isEqualTo("image/png");
        assertThat(r.file().data()).containsExactly(1, 2, 3);
    }

    @Test
    void blankColourAndMessage_areLeftOut() {
        ScreenRequest req = form();
        req.setHexColor("");
        req.setMessage("   ");

        Aurora.PosterRequest r = PosterRequestMapper.toPosterRequest(req, null, null, POSTER);

        assertThat(r.accentColor()).isNull();
        assertThat(r.message()).isNull();
    }

    @ParameterizedTest
    @EnumSource(AuroraRejectedException.Reason.class)
    void everyRejection_hasAReadableMessage(AuroraRejectedException.Reason reason) {
        assertThat(PosterRequestMapper.rejectionMessage(reason)).isNotBlank().doesNotContain("Aurora");
    }
}
