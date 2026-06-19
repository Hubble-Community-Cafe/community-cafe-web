package cafe.community.backend.controller;

import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.repository.VacancyRepository;
import cafe.community.backend.service.VacancyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class VacancyControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired VacancyService service;
    @Autowired VacancyRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private VacancyRequest req(String title, String bar, boolean active) {
        return new VacancyRequest(title, null, null, null, null, null, null, bar, active, 0);
    }

    @Test
    void publicGetActive_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/vacancies/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicGetActive_returnsActiveVacancies() throws Exception {
        service.create(req("Manager", "HUBBLE", true));
        service.create(req("Chef", "HUBBLE", false));

        mockMvc.perform(get("/api/vacancies/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Manager"));
    }

    @Test
    void adminList_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/admin/vacancies"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreate_returnsCreated() throws Exception {
        mockMvc.perform(post("/api/admin/vacancies")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Manager","bar":"HUBBLE","active":true,"sortOrder":0}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Manager"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void adminUpdate_changesTitle() throws Exception {
        var v = service.create(req("Old", "HUBBLE", true));

        mockMvc.perform(put("/api/admin/vacancies/" + v.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"New","bar":"HUBBLE","active":true,"sortOrder":0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New"));
    }

    @Test
    void adminDelete_removes() throws Exception {
        var v = service.create(req("Gone", "HUBBLE", true));

        mockMvc.perform(delete("/api/admin/vacancies/" + v.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());
    }
}
