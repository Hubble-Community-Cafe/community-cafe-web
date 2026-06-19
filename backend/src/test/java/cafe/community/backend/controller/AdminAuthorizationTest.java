package cafe.community.backend.controller;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.repository.AdminUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the role hierarchy across admin endpoints: VIEWER reads but cannot
 * write, DDD_POSTER may edit only the daily dish, and EDITOR may write content.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminAuthorizationTest {

    @Autowired MockMvc mockMvc;
    @Autowired AdminUserRepository userRepo;

    private static final String DAILY_DISH_BODY = """
            {"date":"2026-07-01","name":"Pasta","price":9.50}
            """;
    private static final String MENU_CATEGORY_BODY = """
            {"name":"Drinks","kind":"DRINK","sortOrder":0}
            """;
    private static final String VACANCY_BODY = """
            {"title":"Manager","bar":"HUBBLE","active":true,"sortOrder":0}
            """;

    @BeforeEach
    void clean() {
        userRepo.deleteAll();
    }

    /** Seed a user with a fixed role so the role filter assigns its authorities. */
    private RequestPostProcessor as(String oid, AdminRole role) {
        AdminUser u = new AdminUser();
        u.setAzureOid(oid);
        u.setEmail(oid + "@test.invalid");
        u.setDisplayName(oid);
        u.setRole(role);
        userRepo.save(u);
        return jwt().jwt(j -> j.claim("oid", oid).claim("preferred_username", u.getEmail()));
    }

    // ===== Viewer: read-only =====

    @Test
    void viewer_canReadAdminContent() throws Exception {
        mockMvc.perform(get("/api/admin/vacancies").with(as("viewer-1", AdminRole.VIEWER)))
                .andExpect(status().isOk());
    }

    @Test
    void viewer_cannotWriteContent() throws Exception {
        mockMvc.perform(post("/api/admin/vacancies").with(as("viewer-2", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(VACANCY_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewer_cannotEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(as("viewer-3", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isForbidden());
    }

    // ===== DDD poster: only the daily dish =====

    @Test
    void dddPoster_canEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(as("ddd-1", AdminRole.DDD_POSTER))
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void dddPoster_canReadAdminContent() throws Exception {
        mockMvc.perform(get("/api/admin/daily-dish").with(as("ddd-2", AdminRole.DDD_POSTER)))
                .andExpect(status().isOk());
    }

    @Test
    void dddPoster_cannotEditMenu() throws Exception {
        mockMvc.perform(post("/api/admin/menu/categories").with(as("ddd-3", AdminRole.DDD_POSTER))
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isForbidden());
    }

    // ===== Editor: content writes, including the daily dish =====

    @Test
    void editor_canEditMenu() throws Exception {
        mockMvc.perform(post("/api/admin/menu/categories").with(as("editor-1", AdminRole.EDITOR))
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void editor_canEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(as("editor-2", AdminRole.EDITOR))
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isCreated());
    }

    // ===== Anonymous =====

    @Test
    void anonymous_cannotReadAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/daily-dish"))
                .andExpect(status().isUnauthorized());
    }
}
