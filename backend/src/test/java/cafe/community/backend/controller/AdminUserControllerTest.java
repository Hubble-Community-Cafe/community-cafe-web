package cafe.community.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the security wiring end to end: anonymous requests are rejected, an
 * authenticated user is auto-provisioned as VIEWER by the role filter, and
 * admin-only endpoints enforce the database-backed role.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid=admin-oid")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static org.springframework.test.web.servlet.request.RequestPostProcessor user(String oid) {
        return jwt().jwt(j -> j.claim("oid", oid)
                .claim("preferred_username", oid + "@hubble.cafe")
                .claim("name", oid));
    }

    @Test
    void health_isPublic() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void me_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void me_provisionsViewerOnFirstCall() throws Exception {
        mockMvc.perform(get("/api/admin/users/me").with(user("viewer-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VIEWER"))
                .andExpect(jsonPath("$.email").value("viewer-1@hubble.cafe"));
    }

    @Test
    void listUsers_isForbiddenForViewers() throws Exception {
        mockMvc.perform(get("/api/admin/users").with(user("viewer-2")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsers_isAllowedForTheInitialAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users").with(user("admin-oid")))
                .andExpect(status().isOk());
    }
}
