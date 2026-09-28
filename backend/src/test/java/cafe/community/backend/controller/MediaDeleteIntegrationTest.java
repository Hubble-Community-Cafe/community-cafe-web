package cafe.community.backend.controller;

import cafe.community.backend.media.TestImages;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.Event;
import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.EventRepository;
import cafe.community.backend.repository.MediaAssetRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.nio.file.Path;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Deleting media end to end, with real commits: unlike the other controller tests this class is not
 * wrapped in a rolled-back test transaction, because the file is only removed after the delete
 * commits. It cleans up after itself instead.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid = editor-oid")
class MediaDeleteIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired MediaAssetRepository mediaRepo;
    @Autowired EventRepository eventRepo;
    @Autowired Environment env;

    @AfterEach
    void clean() {
        eventRepo.deleteAll();
        mediaRepo.deleteAll();
    }

    @Test
    void anImageAnEventShowsIsRefusedWith409AndStaysOnDisk() throws Exception {
        MediaAsset asset = upload("quiz.jpg");
        Event event = new Event();
        event.setBar(BarLocation.HUBBLE);
        event.setTitle("Pub quiz");
        event.setDate(LocalDate.now().plusDays(7));
        event.setImage(asset);
        eventRepo.save(event);

        mockMvc.perform(delete("/api/admin/media/" + asset.getId()).with(editor()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "This image is still used by the event 'Pub quiz'. Choose another image there first."));

        assertThat(mediaRepo.existsById(asset.getId())).isTrue();
        assertThat(file(asset)).exists();
    }

    @Test
    void anUnusedImageIsDeletedAndItsFileGoesAfterTheCommit() throws Exception {
        MediaAsset asset = upload("old.jpg");
        assertThat(file(asset)).exists();

        mockMvc.perform(delete("/api/admin/media/" + asset.getId()).with(editor()))
                .andExpect(status().isNoContent());

        assertThat(mediaRepo.existsById(asset.getId())).isFalse();
        assertThat(file(asset)).doesNotExist();
    }

    private MediaAsset upload(String name) throws Exception {
        String body = mockMvc.perform(multipart("/api/admin/media")
                        .file(new MockMultipartFile("file", name, "image/jpeg", TestImages.jpeg(8, 8)))
                        .with(editor()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = JsonPath.parse(body).read("$.id", Long.class);
        return mediaRepo.findById(id).orElseThrow();
    }

    private Path file(MediaAsset asset) {
        return Path.of(env.getRequiredProperty("app.media-dir"), asset.getFilename());
    }

    private static RequestPostProcessor editor() {
        return jwt().jwt(j -> j.claim("oid", "editor-oid").claim("preferred_username", "editor@test.invalid"));
    }
}
