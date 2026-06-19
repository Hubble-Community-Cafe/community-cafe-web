package cafe.community.backend.controller;

import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.repository.AssociationRepository;
import cafe.community.backend.service.AssociationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid = editor-oid")
@Transactional
class AssociationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired AssociationService service;
    @Autowired AssociationRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private AssociationRequest req(String name, String bar) {
        return new AssociationRequest(name, null, bar);
    }

    @Test
    void publicGetForBar_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/associations/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicGetForBar_returnsAssociations() throws Exception {
        service.create(req("Inter Actief", "HUBBLE"));
        service.create(req("Meteor Only", "METEOR"));

        mockMvc.perform(get("/api/associations/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Inter Actief"));
    }

    @Test
    void adminList_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/admin/associations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreate_returnsCreated() throws Exception {
        mockMvc.perform(post("/api/admin/associations")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Inter Actief","bar":"HUBBLE"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Inter Actief"));
    }

    @Test
    void adminUpdate_changesName() throws Exception {
        var a = service.create(req("Old", "HUBBLE"));

        mockMvc.perform(put("/api/admin/associations/" + a.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"New","bar":"HUBBLE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New"));
    }

    @Test
    void adminDelete_removes() throws Exception {
        var a = service.create(req("Gone", "HUBBLE"));

        mockMvc.perform(delete("/api/admin/associations/" + a.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());
    }
}
