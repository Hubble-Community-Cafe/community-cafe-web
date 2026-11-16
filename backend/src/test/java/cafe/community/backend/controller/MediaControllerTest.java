package cafe.community.backend.controller;

import cafe.community.backend.media.TestImages;
import cafe.community.backend.repository.MediaAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static cafe.community.backend.TestUsers.token;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid = editor-oid")
@Transactional
class MediaControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired MediaAssetRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private MockMultipartFile jpeg(String name) {
        // A real JPEG: uploads are parsed to strip metadata, so bare header bytes are refused.
        return new MockMultipartFile("file", name, "image/jpeg", TestImages.jpeg(16, 16));
    }

    @Test
    void list_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/admin/media"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_requiresAuth() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").file(jpeg("photo.jpg")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_createsAsset() throws Exception {
        mockMvc.perform(multipart("/api/admin/media")
                        .file(jpeg("event.jpg"))
                        .param("alt", "An event photo")
                        .with(token("editor-oid")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename").exists())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("/media/")))
                .andExpect(jsonPath("$.alt").value("An event photo"));
    }

    @Test
    void upload_rejectsNonImage() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile("file", "doc.pdf", "application/pdf",
                new byte[]{0x25, 0x50, 0x44, 0x46});

        mockMvc.perform(multipart("/api/admin/media")
                        .file(pdf)
                        .with(token("editor-oid")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returnsUploadedAssets() throws Exception {
        mockMvc.perform(multipart("/api/admin/media")
                        .file(jpeg("a.jpg"))
                        .with(token("editor-oid")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/admin/media")
                        .with(token("editor-oid")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void delete_removesAsset() throws Exception {
        String response = mockMvc.perform(multipart("/api/admin/media")
                        .file(jpeg("b.jpg"))
                        .with(token("editor-oid")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long id = com.jayway.jsonpath.JsonPath.parse(response).read("$.id", Long.class);

        mockMvc.perform(delete("/api/admin/media/" + id)
                        .with(token("editor-oid")))
                .andExpect(status().isNoContent());
    }
}
