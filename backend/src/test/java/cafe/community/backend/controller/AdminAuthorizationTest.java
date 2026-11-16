package cafe.community.backend.controller;

import cafe.community.backend.media.TestImages;
import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AccessPreset;
import cafe.community.backend.model.AdminModule;
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

import static cafe.community.backend.TestUsers.withAccess;
import static cafe.community.backend.TestUsers.withPreset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies per-tab access across admin endpoints. The presets keep the access of the old roles:
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

    // ===== Per tab =====

    @Test
    void withoutAnyAccess_contentIsHiddenButTheOwnProfileLoads() throws Exception {
        RequestPostProcessor nobody = withAccess(userRepo, "nobody", Map.of());

        for (String uri : new String[]{"/api/admin/menu/categories", "/api/admin/daily-dish",
                "/api/admin/opening-hours/HUBBLE/overrides", "/api/admin/events/HUBBLE",
                "/api/admin/board/terms", "/api/admin/vacancies", "/api/admin/associations", "/api/admin/media"}) {
            mockMvc.perform(get(uri).with(nobody)).andExpect(status().isForbidden());
        }
        mockMvc.perform(get("/api/admin/users/me").with(nobody)).andExpect(status().isOk());
    }

    @Test
    void editOnOneTab_doesNotReachAnother() throws Exception {
        RequestPostProcessor recruiter = withAccess(userRepo, "recruiter", Map.of(AdminModule.VACANCIES, AccessLevel.EDIT));

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
        RequestPostProcessor reader = withAccess(userRepo, "reader", Map.of(AdminModule.MENU, AccessLevel.VIEW));

        mockMvc.perform(get("/api/admin/menu/categories").with(reader)).andExpect(status().isOk());
        mockMvc.perform(post("/api/admin/menu/categories").with(reader)
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void dailyDishEditAlone_postsDishesButNotTheMenu() throws Exception {
        RequestPostProcessor cook = withAccess(userRepo, "cook", Map.of(AdminModule.DAILY_DISH, AccessLevel.EDIT));

        mockMvc.perform(post("/api/admin/daily-dish").with(cook)
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/admin/menu/categories").with(cook)).andExpect(status().isForbidden());
    }

    @Test
    void editingATabWithTheMediaPicker_listsAndUploadsImagesButCannotDelete() throws Exception {
        for (AdminModule module : new AdminModule[]{AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS}) {
            RequestPostProcessor picker = withAccess(userRepo, "picker-" + module, Map.of(module, AccessLevel.EDIT));

            mockMvc.perform(get("/api/admin/media").with(picker)).andExpect(status().isOk());
            mockMvc.perform(multipart("/api/admin/media").file(jpeg()).with(picker))
                    .andExpect(status().isCreated());
            mockMvc.perform(delete("/api/admin/media/999999").with(picker)).andExpect(status().isForbidden());
        }
    }

    @Test
    void viewingATabWithTheMediaPicker_cannotUpload() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").file(jpeg())
                        .with(withAccess(userRepo, "board-reader", Map.of(AdminModule.BOARD, AccessLevel.VIEW))))
                .andExpect(status().isForbidden());
    }

    @Test
    void editingATabWithoutTheMediaPicker_cannotUpload() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").file(jpeg())
                        .with(withAccess(userRepo, "events-editor", Map.of(AdminModule.EVENTS, AccessLevel.EDIT))))
                .andExpect(status().isForbidden());
    }

    @Test
    void mediaView_listsButCannotUploadOrDelete() throws Exception {
        RequestPostProcessor browser = withAccess(userRepo, "browser", Map.of(AdminModule.MEDIA, AccessLevel.VIEW));

        mockMvc.perform(get("/api/admin/media").with(browser)).andExpect(status().isOk());
        mockMvc.perform(multipart("/api/admin/media").file(jpeg()).with(browser)).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/admin/media/999999").with(browser)).andExpect(status().isForbidden());
    }

    @Test
    void mediaEdit_uploadsAndDeletes() throws Exception {
        RequestPostProcessor librarian = withAccess(userRepo, "librarian", Map.of(AdminModule.MEDIA, AccessLevel.EDIT));
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
        mockMvc.perform(get("/api/admin/vacancies").with(withPreset(userRepo, "viewer-1", AccessPreset.VIEWER)))
                .andExpect(status().isOk());
    }

    @Test
    void viewer_cannotWriteContent() throws Exception {
        mockMvc.perform(post("/api/admin/vacancies").with(withPreset(userRepo, "viewer-2", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(VACANCY_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewer_cannotReorderContent() throws Exception {
        mockMvc.perform(patch("/api/admin/vacancies/reorder").with(withPreset(userRepo, "viewer-4", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(REORDER_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/menu/categories/reorder").with(withPreset(userRepo, "viewer-5", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bar":"HUBBLE","orderedIds":[1]}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/board/terms/reorder").with(withPreset(userRepo, "viewer-6", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(REORDER_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewer_cannotBulkEditMenuItems() throws Exception {
        mockMvc.perform(patch("/api/admin/menu/items/bulk-price").with(withPreset(userRepo, "viewer-7", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":[1],"regularPrice":7.50}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/menu/items/bulk-move").with(withPreset(userRepo, "viewer-8", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":[1],"categoryId":1}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewer_cannotEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(withPreset(userRepo, "viewer-3", AccessPreset.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isForbidden());
    }

    // ===== DDD poster: only the daily dish =====

    @Test
    void dddPoster_canEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(withPreset(userRepo, "ddd-1", AccessPreset.DDD_POSTER))
                        .contentType(MediaType.APPLICATION_JSON).content(DAILY_DISH_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void dddPoster_canReadAdminContent() throws Exception {
        mockMvc.perform(get("/api/admin/daily-dish").with(withPreset(userRepo, "ddd-2", AccessPreset.DDD_POSTER)))
                .andExpect(status().isOk());
    }

    @Test
    void dddPoster_cannotEditMenu() throws Exception {
        mockMvc.perform(post("/api/admin/menu/categories").with(withPreset(userRepo, "ddd-3", AccessPreset.DDD_POSTER))
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isForbidden());
    }

    // ===== Editor: content writes, including the daily dish =====

    @Test
    void editor_canEditMenu() throws Exception {
        mockMvc.perform(post("/api/admin/menu/categories").with(withPreset(userRepo, "editor-1", AccessPreset.EDITOR))
                        .contentType(MediaType.APPLICATION_JSON).content(MENU_CATEGORY_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void editor_canEditDailyDish() throws Exception {
        mockMvc.perform(post("/api/admin/daily-dish").with(withPreset(userRepo, "editor-2", AccessPreset.EDITOR))
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
