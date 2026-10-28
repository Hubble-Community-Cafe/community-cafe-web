package cafe.community.backend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the security wiring end to end: anonymous requests are rejected, an
 * authenticated user is auto-provisioned without access by the role filter, admin-only
 * endpoints enforce the database-backed role, and admins set per-tab access.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid=admin-oid")
class AdminUserControllerTest {

    private static final String EVENTS_EDITOR = """
            {"admin":false,"permissions":{"EVENTS":"EDIT","MENU":"HIDDEN"}}
            """;

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
    void me_provisionsStaffWithoutAccessOnFirstCall() throws Exception {
        mockMvc.perform(get("/api/admin/users/me").with(user("viewer-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STAFF"))
                .andExpect(jsonPath("$.email").value("viewer-1@hubble.cafe"))
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.permissions.MENU").value("HIDDEN"))
                .andExpect(jsonPath("$.permissions.SCREENS").value("HIDDEN"));
    }

    @Test
    void aNewUserCannotOpenAnyContent() throws Exception {
        mockMvc.perform(get("/api/admin/menu/categories").with(user("newcomer")))
                .andExpect(status().isForbidden());
    }

    @Test
    void me_listsEveryModuleAsEditableForAnAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users/me").with(user("admin-oid")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(true))
                .andExpect(jsonPath("$.permissions.SCREEN_POSTERS").value("EDIT"))
                .andExpect(jsonPath("$.permissions.MEDIA").value("EDIT"));
    }

    @Test
    void updateAccess_isForbiddenForNonAdmins() throws Exception {
        long id = idOf("target-1");
        mockMvc.perform(put("/api/admin/users/" + id + "/access").with(user("editor-ish"))
                        .contentType(MediaType.APPLICATION_JSON).content(EVENTS_EDITOR))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateAccess_setsTheAccessForAnAdmin() throws Exception {
        long id = idOf("target-2");
        mockMvc.perform(put("/api/admin/users/" + id + "/access").with(user("admin-oid"))
                        .contentType(MediaType.APPLICATION_JSON).content(EVENTS_EDITOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STAFF"))
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.permissions.EVENTS").value("EDIT"))
                .andExpect(jsonPath("$.permissions.MENU").value("HIDDEN"));
    }

    @Test
    void updateAccess_rejectsAnUnknownModule() throws Exception {
        long id = idOf("target-3");
        mockMvc.perform(put("/api/admin/users/" + id + "/access").with(user("admin-oid"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"admin":false,"permissions":{"KITCHEN":"EDIT"}}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAccess_rejectsViewOnlyScreenPosters() throws Exception {
        long id = idOf("target-4");
        mockMvc.perform(put("/api/admin/users/" + id + "/access").with(user("admin-oid"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"admin":false,"permissions":{"SCREEN_POSTERS":"VIEW"}}
                                """))
                .andExpect(status().isBadRequest());
    }

    /** Provision a user by letting them call /me once, and return their id. */
    private long idOf(String oid) throws Exception {
        String body = mockMvc.perform(get("/api/admin/users/me").with(user(oid)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.parse(body).read("$.id", Long.class);
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
