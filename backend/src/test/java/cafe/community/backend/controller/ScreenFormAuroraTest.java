package cafe.community.backend.controller;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraClient;
import cafe.community.backend.aurora.AuroraException;
import cafe.community.backend.aurora.AuroraRejectedException;
import cafe.community.backend.mail.FormEmail;
import cafe.community.backend.mail.FormMailService;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The Hubble poster screens form with Aurora in the loop: the request goes to Aurora for review
 * and staff get a notice; Aurora being unusable falls back to emailing the poster; Aurora
 * refusing the file reaches the requester as a readable message.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@ExtendWith(OutputCaptureExtension.class)
class ScreenFormAuroraTest {

    private static final String STAFF = "screens@hubble.cafe";
    private static final String REQUESTER = "anke@x.com";

    @Autowired MockMvc mockMvc;
    @Autowired FormSubmissionRepository repo;
    @MockitoBean FormMailService mail;
    @MockitoBean AuroraClient aurora;

    @BeforeEach
    void setUp() {
        repo.deleteAll();
        when(aurora.isEnabled()).thenReturn(true);
        when(aurora.createPosterRequest(any()))
                .thenReturn(new Aurora.CreatedPosterRequest(1, "2026-10-07T10:00:00.000Z"));
    }

    private static MockMultipartHttpServletRequestBuilder dated() {
        return form().param("startDate", "2026-07-01").param("endDate", "2026-07-15");
    }

    private static MockMultipartHttpServletRequestBuilder form() {
        return multipart("/api/forms/screen")
                .file(new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3}))
                .param("name", "Anke").param("association", "Doppio").param("email", REQUESTER)
                .param("hexColor", "#FFF200").param("message", "Please post");
    }

    private Aurora.PosterRequest sentToAurora() {
        ArgumentCaptor<Aurora.PosterRequest> captor = ArgumentCaptor.forClass(Aurora.PosterRequest.class);
        verify(aurora).createPosterRequest(captor.capture());
        return captor.getValue();
    }

    private ArgumentCaptor<FormEmail> emails(int count) {
        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(count)).send(sent.capture());
        return sent;
    }

    private static FormEmail to(ArgumentCaptor<FormEmail> captor, String recipient) {
        return captor.getAllValues().stream()
                .filter(e -> recipient.equals(e.to()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No email sent to " + recipient));
    }

    // ── Aurora accepts ───────────────────────────────────────────────────────────

    @Test
    void datedPoster_goesToAuroraWithAmsterdamDateTimes() throws Exception {
        mockMvc.perform(dated()).andExpect(status().isNoContent());

        Aurora.PosterRequest r = sentToAurora();
        assertThat(r.requesterName()).isEqualTo("Anke");
        assertThat(r.requesterEmail()).isEqualTo(REQUESTER);
        assertThat(r.requesterAssociation()).isEqualTo("Doppio");
        assertThat(r.message()).isEqualTo("Please post");
        assertThat(r.name()).isEqualTo("Doppio: 2026-07-01 to 2026-07-15");
        assertThat(r.label()).isNull();
        assertThat(r.startDate().toString()).isEqualTo("2026-07-01T00:00+02:00");
        assertThat(r.expirationDate().toString()).isEqualTo("2026-07-16T00:00+02:00");
        assertThat(r.accentColor()).isEqualTo("#FFF200");
        assertThat(r.defaultTimeout()).isEqualTo(30);
        assertThat(r.file().filename()).isEqualTo("poster.png");
        assertThat(r.file().data()).containsExactly(1, 2, 3);
        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    void permanentPoster_goesToAuroraWithoutDates() throws Exception {
        mockMvc.perform(form().param("permanent", "true")).andExpect(status().isNoContent());

        Aurora.PosterRequest r = sentToAurora();
        assertThat(r.startDate()).isNull();
        assertThat(r.expirationDate()).isNull();
        assertThat(r.name()).isEqualTo("Doppio: permanent");
    }

    @Test
    void accepted_staffGetANoticeWithoutTheFile() throws Exception {
        mockMvc.perform(dated()).andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = emails(2);
        FormEmail notice = to(sent, STAFF);
        assertThat(notice.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(notice.replyTo()).isEqualTo(REQUESTER);
        assertThat(notice.subject()).isEqualTo("Poster request from Anke - Doppio: review in Aurora");
        assertThat(notice.body())
                .startsWith("A new poster request was placed through the Hubble website.\n")
                .contains("waiting for review in Aurora")
                .contains("Name: Anke").contains("Association: Doppio").contains("Mail: " + REQUESTER)
                .contains("Start Date: 2026-07-01").contains("End Date: 2026-07-15")
                .contains("Hex: #FFF200").contains("File: poster.png")
                .contains("Message:\nPlease post")
                .doesNotContain("NOT in").doesNotContain("Cafe:");
        assertThat(notice.attachments()).isEmpty();

        FormEmail ack = to(sent, REQUESTER);
        assertThat(ack.subject()).isEqualTo("We received your poster screen request");
        assertThat(ack.attachments()).isEmpty();
    }

    @Test
    void accepted_aFailedStaffNoticeDoesNotFailTheRequest(CapturedOutput output) throws Exception {
        doThrow(new IllegalStateException("smtp down"))
                .doNothing()
                .when(mail).send(any());

        mockMvc.perform(dated()).andExpect(status().isNoContent());

        emails(2);
        assertThat(output.getAll()).contains("Poster request is in Aurora, but the staff notice failed")
                .doesNotContain(REQUESTER);
    }

    // ── Aurora unusable: email fallback ──────────────────────────────────────────

    @Test
    void auroraDown_emailsThePosterWithANote(CapturedOutput output) throws Exception {
        when(aurora.createPosterRequest(any())).thenThrow(new AuroraException("Could not reach Aurora"));

        mockMvc.perform(dated()).andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = emails(2);
        FormEmail staff = to(sent, STAFF);
        assertThat(staff.subject()).isEqualTo("Screen Request from Anke - Doppio");
        assertThat(staff.body())
                .startsWith("Aurora could not be reached, so this request is NOT in\nAurora.")
                .contains("Personal Details:").contains("Association: Doppio").contains("Hex: #FFF200");
        assertThat(staff.attachments()).singleElement()
                .satisfies(a -> assertThat(a.filename()).isEqualTo("poster.png"));
        assertThat(to(sent, REQUESTER).subject()).isEqualTo("We received your poster screen request");
        assertThat(output.getAll()).contains("Aurora is unavailable for a poster request")
                .doesNotContain(REQUESTER);
    }

    @Test
    void auroraNotConfigured_emailsThePosterWithoutCallingAurora() throws Exception {
        when(aurora.isEnabled()).thenReturn(false);

        mockMvc.perform(dated()).andExpect(status().isNoContent());

        verify(aurora, never()).createPosterRequest(any());
        assertThat(to(emails(2), STAFF).attachments()).hasSize(1);
    }

    // ── Aurora refuses: the requester sees why ──────────────────────────────────

    @Test
    void auroraRefusesTheFile_showsTheRequesterWhyAndSendsNothing(CapturedOutput output) throws Exception {
        when(aurora.createPosterRequest(any())).thenThrow(new AuroraRejectedException(
                AuroraRejectedException.Reason.UNSUPPORTED_FILE, "Aurora refused the poster request with 415"));

        mockMvc.perform(dated())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "We could not read your poster. Please upload a valid JPG, PNG or MP4 file "
                                + "(iPhone .mov videos are not supported)."));

        verify(mail, never()).send(any());
        assertThat(repo.count()).isZero();
        assertThat(output.getAll()).contains("Aurora refused a poster request (UNSUPPORTED_FILE)")
                .doesNotContain(REQUESTER);
    }

    @Test
    void auroraRefusesTheSize_showsTheLimits() throws Exception {
        when(aurora.createPosterRequest(any())).thenThrow(new AuroraRejectedException(
                AuroraRejectedException.Reason.TOO_LARGE, "413"));

        mockMvc.perform(dated())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("20 MB")));
    }

    // ── Size limit and validation still come first ──────────────────────────────

    @Test
    void posterOver10MbButWithin20Mb_isAccepted() throws Exception {
        byte[] big = new byte[15 * 1024 * 1024];
        mockMvc.perform(multipart("/api/forms/screen")
                        .file(new MockMultipartFile("file", "clip.mp4", "video/mp4", big))
                        .param("name", "Anke").param("association", "Doppio").param("email", REQUESTER)
                        .param("permanent", "true"))
                .andExpect(status().isNoContent());

        assertThat(sentToAurora().file().data()).hasSize(big.length);
    }

    @Test
    void posterOver20Mb_isRejectedBeforeAurora() throws Exception {
        mockMvc.perform(multipart("/api/forms/screen")
                        .file(new MockMultipartFile("file", "clip.mp4", "video/mp4", new byte[20 * 1024 * 1024 + 1]))
                        .param("name", "Anke").param("association", "Doppio").param("email", REQUESTER)
                        .param("permanent", "true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The file is too large (max 20 MB)."));

        verify(aurora, never()).createPosterRequest(any());
    }

    @Test
    void invalidDates_areRejectedBeforeAurora() throws Exception {
        mockMvc.perform(form().param("startDate", "2026-07-15").param("endDate", "2026-07-01"))
                .andExpect(status().isBadRequest());

        verify(aurora, never()).createPosterRequest(any());
        verify(mail, never()).send(any());
    }

    @Test
    void honeypot_neverReachesAurora() throws Exception {
        mockMvc.perform(dated().param("honeypot", "http://spam.example")).andExpect(status().isNoContent());

        verify(aurora, never()).createPosterRequest(any());
        verify(mail, never()).send(any());
    }
}
