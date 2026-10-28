package cafe.community.backend.controller;

import cafe.community.backend.media.TestImages;
import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AccessPresets;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.repository.AdminUserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies per-tab access across admin endpoints. The old roles (as presets) keep their access:
 * VIEWER reads but cannot write, DDD_POSTER may edit only the daily dish, EDITOR may write content.
 * Beyond that, each tab is hidden, readable or editable on its own.
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
    private static final String REORDER_BODY = """
            {"orderedIds":[1]}
            """;

    @BeforeEach
    void clean() {
        userRepo.deleteAllInBatch();
    }

    /** Seed a user with a fixed role so the role filter assigns its authorities. */
    private RequestPostProcessor as(String oid, AdminRole role) {
        AdminUser u = new AdminUser();
        u.setAzureOid(oid);
        u.setEmail(oid + "@test.invalid");
        u.setDisplayName(oid);
        u.setRole(role);
        AccessPresets.applyTo(u, role);
        userRepo.saveAndFlush(u);
        return jwt().jwt(j -> j.claim("oid", oid).claim("preferred_username", u.getEmail()));
    }

    /** Seed a user with exactly these permissions and no old-role extras. */
    private RequestPostProcessor withAccess(String oid, Map<AdminModule, AccessLevel> permissions) {
        AdminUser u = new AdminUser();
        u.setAzureOid(oid);
        u.setEmail(oid + "@test.invalid");
        u.setRole(AdminRole.VIEWER);
        u.getPermissions().putAll(permissions);
        // Flushed: the filter's last-seen update clears the persistence context, which would drop
        // permission rows still waiting to be written.
        userRepo.saveAndFlush(u);
        return jwt().jwt(j -> j.claim("oid", oid).claim("preferred_username", u.getEmail()));
    }

    // ===== Per tab =====

    @Test
    void withoutAnyAccess_contentIsHiddenButTheOwnProfileLoads() throws Exception {
        RequestPostProcessor nobody = withAccess("nobody", Map.of());

        for (String uri : new String[]{"/api/admin/menu/categories", "/api/admin/daily-dish",
                "/api/admin/opening-hours/HUBBLE/overrides", "/api/admin/events/HUBBLE",
                "/api/admin/board/terms", "/api/admin/vacancies", "/api/admin/associations", "/api/admin/media"}) {
            mockMvc.perform(get(uri).with(nobody)).andExpect(status().isForbidden());
        }
        mockMvc.perform(get("/api/admin/users/me").with(nobody)).andExpect(status().isOk());
    }

    @Test
    void editOnOneTab_doesNotReachAnother() throws Exception {
        RequestPostProcessor recruiter = withAccess("recruiter", Map.of(AdminModule.VACANCIES, AccessLevel.EDIT));

        mockMvc.perform(get("/api/admin/vacancies").with(recruiter)).andExpect(status().isOk());
        mockMvc.perform(post("/api/admin/vacancies").with(recruiter)
                        .contentType(MediaType.APPLICATION_JSON).content(VACANCY_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/admin/menu/categories").with(recruiter)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/menu/categories").with(recruiter)
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewOnATab_readsButCannotWrite() throws Exception {
        RequestPostProcessor reader = withAccess("reader", Map.of(AdminModule.MENU, AccessLevel.VIEW));

        mockMvc.perform(get("/api/admin/menu/categories").with(reader)).andExpect(status().isOk());
        mockMvc.perform(post("/api/admin/menu/categories").with(reader)
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void dailyDishEditAlone_postsDishesButNotTheMenu() throws Exception {
        RequestPostProcessor cook = withAccess("cook", Map.of(AdminModule.DAILY_DISH, AccessLevel.EDIT));

        mockMvc.perform(post("/api/admin/daily-dish").with(cook)
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/admin/menu/categories").with(cook)).andExpect(status().isForbidden());
    }

    @Test
    void editingATabWithTheMediaPicker_listsAndUploadsImagesButCannotDelete() throws Exception {
        for (AdminModule module : new AdminModule[]{AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS}) {
            RequestPostProcessor picker = withAccess("picker-" + module, Map.of(module, AccessLevel.EDIT));

            mockMvc.perform(get("/api/admin/media").with(picker)).andExpect(status().isOk());
            mockMvc.perform(multipart("/api/admin/media").file(jpeg()).with(picker))
                    .andExpect(status().isCreated());
            mockMvc.perform(delete("/api/admin/media/999999").with(picker)).andExpect(status().isForbidden());
        }
    }

    @Test
    void viewingATabWithTheMediaPicker_cannotUpload() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").file(jpeg())
                        .with(withAccess("board-reader", Map.of(AdminModule.BOARD, AccessLevel.VIEW))))
                .andExpect(status().isForbidden());
    }

    @Test
    void editingATabWithoutTheMediaPicker_cannotUpload() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").file(jpeg())
                        .with(withAccess("events-editor", Map.of(AdminModule.EVENTS, AccessLevel.EDIT))))
                .andExpect(status().isForbidden());
    }

    @Test
    void mediaView_listsButCannotUploadOrDelete() throws Exception {
        RequestPostProcessor browser = withAccess("browser", Map.of(AdminModule.MEDIA, AccessLevel.VIEW));

        mockMvc.perform(get("/api/admin/media").with(browser)).andExpect(status().isOk());
        mockMvc.perform(multipart("/api/admin/media").file(jpeg()).with(browser)).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/admin/media/999999").with(browser)).andExpect(status().isForbidden());
    }

    @Test
    void mediaEdit_uploadsAndDeletes() throws Exception {
        RequestPostProcessor librarian = withAccess("librarian", Map.of(AdminModule.MEDIA, AccessLevel.EDIT));
        String created = mockMvc.perform(multipart("/api/admin/media").file(jpeg()).with(librarian))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = JsonPath.parse(created).read("$.id", Long.class);

        mockMvc.perform(delete("/api/admin/media/" + id).with(librarian)).andExpect(status().isNoContent());
    }

    private static MockMultipartFile jpeg() {
        return new MockMultipartFile("file", "photo.jpg", "image/jpeg", TestImages.jpeg(4, 4));
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
    void viewer_cannotReorderContent() throws Exception {
        mockMvc.perform(patch("/api/admin/vacancies/reorder").with(as("viewer-4", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(REORDER_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/menu/categories/reorder").with(as("viewer-5", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bar":"HUBBLE","orderedIds":[1]}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/board/terms/reorder").with(as("viewer-6", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(REORDER_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewer_cannotBulkEditMenuItems() throws Exception {
        mockMvc.perform(patch("/api/admin/menu/items/bulk-price").with(as("viewer-7", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":[1],"regularPrice":7.50}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/menu/items/bulk-move").with(as("viewer-8", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":[1],"categoryId":1}
                                """))
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
