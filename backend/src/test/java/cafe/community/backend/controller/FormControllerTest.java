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
        verify(mail).send(sent.capture());
        FormEmail email = sent.getValue();
        assertThat(email.to()).isEqualTo("nuisance@hubble.cafe");
        assertThat(email.from()).isEqualTo("noreply@meteor.cafe");
        assertThat(email.replyTo()).isEqualTo("alice@x.com");
        assertThat(email.subject()).isEqualTo("Meteor Tip from Alice");
        assertThat(email.body()).contains("Name: Alice").contains("Lovely food");
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
        verify(mail).send(sent.capture());
        FormEmail email = sent.getValue();
        assertThat(email.to()).isEqualTo("screens@hubble.cafe");
        assertThat(email.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(email.subject()).isEqualTo("Screen Request from Anke - Doppio");
        assertThat(email.body()).contains("Association: Doppio").contains("Hex: #FFF200");
        assertThat(email.attachments()).hasSize(1);
        assertThat(email.attachments().get(0).contentType()).isEqualTo("image/png");
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
        verify(mail).send(sent.capture());
        assertThat(sent.getValue().body()).contains("Permanent association poster");
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
        verify(mail).send(sent.capture());
        FormEmail email = sent.getValue();
        assertThat(email.to()).isEqualTo("finance@hubble.cafe");
        assertThat(email.from()).isEqualTo("noreply@hubble.cafe");
        assertThat(email.body()).contains("Amount in Euros: 150.04").contains("IBAN: NL70TRIO033858901");
        assertThat(email.attachments()).hasSize(1);
        assertThat(email.attachments().get(0).contentType()).isEqualTo("application/pdf");
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
}
