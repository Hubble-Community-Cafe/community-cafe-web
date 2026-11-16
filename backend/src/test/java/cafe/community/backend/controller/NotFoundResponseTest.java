package cafe.community.backend.controller;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Editing or deleting something that is already gone (a stale admin tab after a colleague deleted
 * it) is the client's 404, not a server error that pages Sentry.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.initial-admin-oid=not-found-admin-oid")
class NotFoundResponseTest {

    private static final long MISSING = 987_654_321L;

    @Autowired MockMvc mockMvc;

    private RequestPostProcessor asAdmin() {
        return jwt().jwt(j -> j.claim("oid", "not-found-admin-oid")
                .claim("preferred_username", "admin@hubble.cafe")
                .claim("name", "Admin"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/admin/events/",
            "/api/admin/vacancies/",
            "/api/admin/associations/",
            "/api/admin/board/terms/",
            "/api/admin/board/members/",
            "/api/admin/opening-hours/overrides/",
            "/api/admin/media/",
    })
    void deletingSomethingThatIsGone_isA404WithAMessage(String path) throws Exception {
        mockMvc.perform(delete(path + MISSING).with(asAdmin()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(containsString("not found: " + MISSING)));
    }
}
