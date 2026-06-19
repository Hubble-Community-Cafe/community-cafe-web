package cafe.community.backend.controller;

import cafe.community.backend.dto.BoardTermRequest;
import cafe.community.backend.repository.BoardMemberRepository;
import cafe.community.backend.repository.BoardTermRepository;
import cafe.community.backend.service.BoardService;
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
class BoardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired BoardService service;
    @Autowired BoardTermRepository termRepo;
    @Autowired BoardMemberRepository memberRepo;

    @BeforeEach
    void clean() {
        memberRepo.deleteAll();
        termRepo.deleteAll();
    }

    @Test
    void publicGetAll_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/board"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicGetAll_returnsTerms() throws Exception {
        service.createTerm(new BoardTermRequest("2024-2025", "EXECUTIVE", null, true, 0, null, null));

        mockMvc.perform(get("/api/board"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label").value("2024-2025"))
                .andExpect(jsonPath("$[0].current").value(true))
                .andExpect(jsonPath("$[0].members").isArray());
    }

    @Test
    void adminCreateTerm_requiresAuth() throws Exception {
        mockMvc.perform(post("/api/admin/board/terms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"label":"2024-2025","type":"EXECUTIVE","current":true,"sortOrder":0}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreateTerm_returnsCreated() throws Exception {
        mockMvc.perform(post("/api/admin/board/terms")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"label":"2024-2025","type":"EXECUTIVE","current":true,"sortOrder":0}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.label").value("2024-2025"))
                .andExpect(jsonPath("$.type").value("EXECUTIVE"))
                .andExpect(jsonPath("$.current").value(true));
    }

    @Test
    void adminCreateMember_appearsInTerm() throws Exception {
        var term = service.createTerm(new BoardTermRequest("2024-2025", "EXECUTIVE", null, true, 0, null, null));

        mockMvc.perform(post("/api/admin/board/terms/" + term.id() + "/members")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alice","role":"President","sortOrder":0}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.role").value("President"));
    }

    @Test
    void adminUpdateTerm_changesLabel() throws Exception {
        var term = service.createTerm(new BoardTermRequest("Old", "EXECUTIVE", null, false, 0, null, null));

        mockMvc.perform(put("/api/admin/board/terms/" + term.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"label":"New","type":"EXECUTIVE","current":true,"sortOrder":0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("New"));
    }

    @Test
    void adminDeleteTerm_removes() throws Exception {
        var term = service.createTerm(new BoardTermRequest("Gone", "EXECUTIVE", null, false, 0, null, null));

        mockMvc.perform(delete("/api/admin/board/terms/" + term.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminDeleteMember_removes() throws Exception {
        var term = service.createTerm(new BoardTermRequest("2024-2025", "EXECUTIVE", null, true, 0, null, null));
        var member = service.createMember(term.id(),
                new cafe.community.backend.dto.BoardMemberRequest("Bob", "Treasurer", null, 0));

        mockMvc.perform(delete("/api/admin/board/members/" + member.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());
    }
}
