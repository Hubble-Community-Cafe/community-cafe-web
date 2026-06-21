package cafe.community.backend.controller;

import cafe.community.backend.mail.FormEmail;
import cafe.community.backend.mail.FormMailService;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FormControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired FormSubmissionRepository repo;
    @MockitoBean FormMailService mail;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private MockMultipartFile png() {
        return new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3});
    }

    private MockMultipartFile pdf() {
        return new MockMultipartFile("file", "receipt.pdf", "application/pdf", new byte[]{1, 2, 3});
    }

    // ── Complaint ────────────────────────────────────────────────────────────────

    @Test
    void complaint_sendsToMeteorListAndRecordsSubmission() throws Exception {
        mockMvc.perform(post("/api/forms/complaint").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alice","email":"alice@x.com","type":"TIP","message":"Lovely food"}
                                """))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail staff = to(sent, "nuisance@hubble.cafe");
        assertThat(staff.from()).isEqualTo("noreply@meteor.cafe");
        assertThat(staff.replyTo()).isEqualTo("alice@x.com");
        assertThat(staff.subject()).isEqualTo("Meteor Tip from Alice");
        assertThat(staff.body()).contains("Name: Alice").contains("Lovely food");

        // The submitter also gets a confirmation, with replies routed back to the team.
        FormEmail ack = to(sent, "alice@x.com");
        assertThat(ack.from()).isEqualTo("noreply@meteor.cafe");
        assertThat(ack.replyTo()).isEqualTo("noreply@meteor.cafe");
        assertThat(ack.subject()).isEqualTo("We received your tip");
        assertThat(ack.body()).contains("Hi Alice").contains("Lovely food");
        assertThat(ack.attachments()).isEmpty();

        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    void complaint_missingMessage_isRejected() throws Exception {
        mockMvc.perform(post("/api/forms/complaint").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alice","email":"alice@x.com","type":"TIP"}
                                """))
                .andExpect(status().isBadRequest());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void complaint_honeypot_isSilentlyDropped() throws Exception {
        mockMvc.perform(post("/api/forms/complaint").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bot","email":"bot@x.com","type":"TIP","message":"spam","honeypot":"x"}
                                """))
                .andExpect(status().isNoContent());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
        assertThat(repo.count()).isZero();
    }

    // ── Screen ───────────────────────────────────────────────────────────────────

    @Test
    void screen_sendsToScreensListWithAttachment() throws Exception {
        mockMvc.perform(multipart("/api/forms/screen").file(png())
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("cafe", "BOTH").param("startDate", "2026-07-01").param("endDate", "2026-07-15")
                        .param("hexColor", "#FFF200").param("message", "Please post"))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail email = to(sent, "screens@hubble.cafe");
        assertThat(email.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(email.subject()).isEqualTo("Screen Request from Anke - Doppio");
        assertThat(email.body()).contains("Association: Doppio").contains("Hex: #FFF200");
        assertThat(email.attachments()).hasSize(1);
        assertThat(email.attachments().get(0).contentType()).isEqualTo("image/png");

        FormEmail ack = to(sent, "anke@x.com");
        assertThat(ack.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.replyTo()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.subject()).isEqualTo("We received your poster screen request");
        assertThat(ack.body()).contains("Hi Anke").contains("Doppio");
        assertThat(ack.attachments()).isEmpty();
    }

    @Test
    void screen_endBeforeStart_isRejected() throws Exception {
        mockMvc.perform(multipart("/api/forms/screen").file(png())
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("cafe", "HUBBLE").param("startDate", "2026-07-15").param("endDate", "2026-07-01"))
                .andExpect(status().isBadRequest());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void screen_wrongFileType_isRejected() throws Exception {
        MockMultipartFile txt = new MockMultipartFile("file", "x.txt", "text/plain", new byte[]{1});
        mockMvc.perform(multipart("/api/forms/screen").file(txt)
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("cafe", "HUBBLE").param("startDate", "2026-07-01").param("endDate", "2026-07-15"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void screen_permanentPoster_needsNoDates() throws Exception {
        mockMvc.perform(multipart("/api/forms/screen").file(png())
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("cafe", "BOTH").param("permanent", "true"))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());
        assertThat(to(sent, "screens@hubble.cafe").body()).contains("Permanent association poster");
        assertThat(to(sent, "anke@x.com").body()).contains("Permanent association poster");
    }

    @Test
    void screen_missingDatesWithoutPermanent_isRejected() throws Exception {
        mockMvc.perform(multipart("/api/forms/screen").file(png())
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("cafe", "BOTH"))
                .andExpect(status().isBadRequest());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
    }

    // ── Declaration ──────────────────────────────────────────────────────────────

    @Test
    void declaration_sendsToTreasurerWithReceipt() throws Exception {
        mockMvc.perform(multipart("/api/forms/declaration").file(pdf())
                        .param("fullName", "Sven Rooijakkers").param("email", "sven@x.com")
                        .param("iban", "NL70 TRIO 0338 5890 15").param("dateOfPurchase", "2026-06-18")
                        .param("amount", "150,04").param("category", "Other").param("description", "SVH Exam"))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail email = to(sent, "finance@hubble.cafe");
        assertThat(email.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(email.body()).contains("Amount in Euros: 150.04").contains("IBAN: NL70TRIO033858901");
        assertThat(email.attachments()).hasSize(1);
        assertThat(email.attachments().get(0).contentType()).isEqualTo("application/pdf");

        FormEmail ack = to(sent, "sven@x.com");
        assertThat(ack.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.replyTo()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.subject()).isEqualTo("We received your declaration");
        assertThat(ack.body()).contains("Hi Sven Rooijakkers").contains("Amount in euros: 150.04");
        assertThat(ack.attachments()).isEmpty();
    }

    @Test
    void declaration_badAmount_isRejected() throws Exception {
        mockMvc.perform(multipart("/api/forms/declaration").file(pdf())
                        .param("fullName", "Sven").param("email", "sven@x.com")
                        .param("iban", "NL70TRIO0338589015").param("dateOfPurchase", "2026-06-18")
                        .param("amount", "free").param("category", "Other"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void declaration_missingReceipt_isRejected() throws Exception {
        mockMvc.perform(multipart("/api/forms/declaration")
                        .param("fullName", "Sven").param("email", "sven@x.com")
                        .param("iban", "NL70TRIO0338589015").param("dateOfPurchase", "2026-06-18")
                        .param("amount", "10,00").param("category", "Other"))
                .andExpect(status().isBadRequest());
    }

    // ── Tips, Complaints & Ideas (Hubble) ─────────────────────────────────────────

    @Test
    void tips_sendsToNuisanceFromHubbleWithUpdatesFlag() throws Exception {
        mockMvc.perform(post("/api/forms/tips").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Pim","email":"pim@x.com","type":"COMPLAINT",
                                 "message":"Music too loud upstairs","wantsUpdates":true}
                                """))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail staff = to(sent, "nuisance@hubble.cafe");
        assertThat(staff.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(staff.subject()).isEqualTo("Hubble Complaint from Pim");
        assertThat(staff.body()).contains("Music too loud upstairs")
                .contains("Wants updates on this subject: Yes");

        FormEmail ack = to(sent, "pim@x.com");
        assertThat(ack.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.replyTo()).isEqualTo("noreply@hubble.cafe");
        assertThat(ack.subject()).isEqualTo("We received your complaint");
        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    void tips_honeypot_isSilentlyDropped() throws Exception {
        mockMvc.perform(post("/api/forms/tips").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bot","email":"bot@x.com","type":"TIP","message":"spam","honeypot":"x"}
                                """))
                .andExpect(status().isNoContent());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
        assertThat(repo.count()).isZero();
    }

    // ── Information form (Hubble) ─────────────────────────────────────────────────

    @Test
    void information_sendsToInfoListAndConfirms() throws Exception {
        mockMvc.perform(post("/api/forms/information").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Tess","email":"tess@x.com","phone":"+316 12345678",
                                 "message":"Can we host a borrel next month?"}
                                """))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail staff = to(sent, "info@hubble.cafe");
        assertThat(staff.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(staff.subject()).isEqualTo("Hubble information request from Tess");
        assertThat(staff.body()).contains("borrel next month");

        FormEmail ack = to(sent, "tess@x.com");
        assertThat(ack.subject()).isEqualTo("We received your message");
        assertThat(ack.replyTo()).isEqualTo("noreply@hubble.cafe");
    }

    @Test
    void information_missingMessage_isRejected() throws Exception {
        mockMvc.perform(post("/api/forms/information").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Tess","email":"tess@x.com"}
                                """))
                .andExpect(status().isBadRequest());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
    }

    // ── Loan equipment (Hubble) ───────────────────────────────────────────────────

    @Test
    void loan_sendsToLoanListWithPickupReturn() throws Exception {
        mockMvc.perform(post("/api/forms/loan").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Lotte","association":"Doppio","email":"lotte@x.com",
                                 "pickupDate":"2026-07-01","pickupTime":"14:00",
                                 "returnDate":"2026-07-03","returnTime":"12:00",
                                 "message":"Two cantus tables please"}
                                """))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());

        FormEmail staff = to(sent, "loan@hubble.cafe");
        assertThat(staff.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(staff.subject()).isEqualTo("Hubble loan request from Lotte - Doppio");
        assertThat(staff.body()).contains("Pick-up: 2026-07-01 at 14:00")
                .contains("Return: 2026-07-03 at 12:00").contains("cantus tables");

        FormEmail ack = to(sent, "lotte@x.com");
        assertThat(ack.subject()).isEqualTo("We received your loan request");
        assertThat(ack.body()).contains("Doppio");
    }

    @Test
    void loan_missingTimes_isRejected() throws Exception {
        mockMvc.perform(post("/api/forms/loan").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Lotte","association":"Doppio","email":"lotte@x.com",
                                 "pickupDate":"2026-07-01","returnDate":"2026-07-03",
                                 "message":"Two cantus tables please"}
                                """))
                .andExpect(status().isBadRequest());
        verify(mail, never()).send(org.mockito.ArgumentMatchers.any());
    }

    /** Pick the captured email addressed to a given recipient (staff notification or confirmation). */
    private FormEmail to(ArgumentCaptor<FormEmail> captor, String recipient) {
        return captor.getAllValues().stream()
                .filter(e -> recipient.equals(e.to()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No email sent to " + recipient));
    }
}
