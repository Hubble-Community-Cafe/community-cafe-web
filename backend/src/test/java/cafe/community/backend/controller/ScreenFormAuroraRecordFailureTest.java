package cafe.community.backend.controller;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraClient;
import cafe.community.backend.mail.FormEmail;
import cafe.community.backend.mail.FormMailService;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Once Aurora holds the poster request, nothing after it may fail the submission: the requester
 * would send it again and create a duplicate request. Found when a broken local database made
 * the submission record fail after Aurora had already accepted four requests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(OutputCaptureExtension.class)
class ScreenFormAuroraRecordFailureTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean FormSubmissionRepository repo;
    @MockitoBean FormMailService mail;
    @MockitoBean AuroraClient aurora;

    @Test
    void acceptedByAurora_aFailedRecordStillSucceedsAndNotifies(CapturedOutput output) throws Exception {
        when(aurora.isEnabled()).thenReturn(true);
        when(aurora.createPosterRequest(any())).thenReturn(new Aurora.CreatedPosterRequest(1, "now"));
        when(repo.save(any())).thenThrow(new DataIntegrityViolationException("Field 'summary' doesn't have a default value"));

        mockMvc.perform(multipart("/api/forms/screen")
                        .file(new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3}))
                        .param("name", "Anke").param("association", "Doppio").param("email", "anke@x.com")
                        .param("permanent", "true"))
                .andExpect(status().isNoContent());

        ArgumentCaptor<FormEmail> sent = ArgumentCaptor.forClass(FormEmail.class);
        verify(mail, times(2)).send(sent.capture());
        assertThat(sent.getAllValues()).extracting(FormEmail::subject)
                .contains("Poster request from Anke - Doppio: review in Aurora", "We received your poster screen request");
        assertThat(output.getAll()).contains("Poster request is in Aurora, but recording the submission failed")
                .doesNotContain("anke@x.com");
    }
}
