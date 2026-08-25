package cafe.community.backend.controller;

import cafe.community.backend.aurora.AuroraClient;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.ScreenScene;
import cafe.community.backend.repository.AdminUserRepository;
import cafe.community.backend.service.ScreenSceneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authorization for the scene panel: switching a scene is open to any signed-in staff, but
 * choosing which poster a scene shows stays with editors.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminScreenSceneControllerTest {

    private static final String SETTINGS_BODY = """
            {"closedPosterId":3,"lastCallPosterId":4}
            """;

    @Autowired MockMvc mockMvc;
    @Autowired AdminUserRepository userRepo;

    @MockitoBean ScreenSceneService sceneService;
    @MockitoBean AuroraClient auroraClient;

    @BeforeEach
    void clean() {
        userRepo.deleteAll();
    }

    private RequestPostProcessor as(String oid, AdminRole role) {
        AdminUser u = new AdminUser();
        u.setAzureOid(oid);
        u.setEmail(oid + "@test.invalid");
        u.setDisplayName(oid);
        u.setRole(role);
        userRepo.save(u);
        return jwt().jwt(j -> j.claim("oid", oid).claim("preferred_username", u.getEmail()));
    }

    @Test
    void anonymous_cannotReadStatus() throws Exception {
        mockMvc.perform(get("/api/admin/screens/scene"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anonymous_cannotApplyAScene() throws Exception {
        mockMvc.perform(post("/api/admin/screens/scene/CLOSED"))
                .andExpect(status().isUnauthorized());
        verify(sceneService, never()).apply(any());
    }

    @Test
    void viewer_canReadStatus() throws Exception {
        mockMvc.perform(get("/api/admin/screens/scene").with(as("viewer-1", AdminRole.VIEWER)))
                .andExpect(status().isOk());
    }

    @Test
    void viewer_canApplyAScene() throws Exception {
        mockMvc.perform(post("/api/admin/screens/scene/CLOSED").with(as("viewer-2", AdminRole.VIEWER)))
                .andExpect(status().isNoContent());
        verify(sceneService).apply(ScreenScene.CLOSED);
    }

    @Test
    void viewer_cannotChangeThePosterMapping() throws Exception {
        mockMvc.perform(put("/api/admin/screens/settings").with(as("viewer-3", AdminRole.VIEWER))
                        .contentType(MediaType.APPLICATION_JSON).content(SETTINGS_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void editor_canChangeThePosterMapping() throws Exception {
        mockMvc.perform(put("/api/admin/screens/settings").with(as("editor-1", AdminRole.EDITOR))
                        .contentType(MediaType.APPLICATION_JSON).content(SETTINGS_BODY))
                .andExpect(status().isOk());
    }

    @Test
    void unknownScene_isRejected() throws Exception {
        mockMvc.perform(post("/api/admin/screens/scene/PARTY").with(as("viewer-4", AdminRole.VIEWER)))
                .andExpect(status().isBadRequest());
        verify(sceneService, never()).apply(any());
    }

    @Test
    void sceneWithoutAPoster_reportsBadRequest() throws Exception {
        org.mockito.Mockito.doThrow(new IllegalArgumentException("No poster is configured for the Closed scene."))
                .when(sceneService).apply(ScreenScene.CLOSED);

        mockMvc.perform(post("/api/admin/screens/scene/CLOSED").with(as("viewer-5", AdminRole.VIEWER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No poster is configured for the Closed scene."));
    }

    @Test
    void auroraFailure_reportsBadGatewayNotServerError() throws Exception {
        org.mockito.Mockito.doThrow(new cafe.community.backend.aurora.AuroraException("Could not reach Aurora"))
                .when(sceneService).apply(ScreenScene.OPEN);

        mockMvc.perform(post("/api/admin/screens/scene/OPEN").with(as("viewer-6", AdminRole.VIEWER)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("Could not reach Aurora"));
    }
}
