package cafe.community.backend.controller;

import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.repository.EventRepository;
import cafe.community.backend.service.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EventControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired EventService service;
    @Autowired EventRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private EventRequest futureReq(String bar, String title) {
        return new EventRequest(bar, title, null, LocalDate.now().plusDays(3), null, null, null, null, true);
    }

    @Test
    void publicUpcoming_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/events/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicUpcoming_returnsPublishedFutureEvents() throws Exception {
        service.create(futureReq("HUBBLE", "Open Mic"));

        mockMvc.perform(get("/api/events/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Open Mic"));
    }

    @Test
    void adminCreate_requiresAuth() throws Exception {
        mockMvc.perform(post("/api/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bar":"HUBBLE","title":"Test","date":"%s","published":true}
                                """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreate_returnsCreated() throws Exception {
        String body = """
                {"bar":"HUBBLE","title":"Quiz Night","description":"Weekly quiz",
                 "date":"%s","startTime":"20:00","price":"Free","published":true}
                """.formatted(LocalDate.now().plusDays(7));

        mockMvc.perform(post("/api/admin/events")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Quiz Night"))
                .andExpect(jsonPath("$.startTime").value("20:00"))
                .andExpect(jsonPath("$.price").value("Free"));
    }

    @Test
    void adminUpdate_changesEvent() throws Exception {
        var created = service.create(futureReq("HUBBLE", "Original"));
        String body = """
                {"bar":"HUBBLE","title":"Updated","date":"%s","published":true}
                """.formatted(LocalDate.now().plusDays(3));

        mockMvc.perform(put("/api/admin/events/" + created.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated"));
    }

    @Test
    void adminDelete_removesEvent() throws Exception {
        var created = service.create(futureReq("HUBBLE", "To Delete"));

        mockMvc.perform(delete("/api/admin/events/" + created.id())
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/events/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void adminGetAll_includesPastAndUnpublished() throws Exception {
        service.create(new EventRequest("HUBBLE", "Past", null,
                LocalDate.now().minusDays(3), null, null, null, null, false));
        service.create(futureReq("HUBBLE", "Future"));

        mockMvc.perform(get("/api/admin/events/HUBBLE")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
