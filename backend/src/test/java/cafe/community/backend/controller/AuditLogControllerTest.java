package cafe.community.backend.controller;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.repository.AdminUserRepository;
import cafe.community.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Verifies the admin-only audit endpoint and its entity-type / action filters. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuditLogControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired AdminUserRepository userRepo;
    @Autowired AuditLogRepository auditRepo;

    @BeforeEach
    void clean() {
        auditRepo.deleteAll();
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

    private void entry(AuditEntityType type, AuditAction action) {
        AuditLog log = new AuditLog();
        log.setEntityType(type);
        log.setAction(action);
        log.setActorName("tester");
        auditRepo.save(log);
    }

    @Test
    void list_requiresAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/audit").with(as("ed", AdminRole.EDITOR)))
                .andExpect(status().isForbidden());
    }

    @Test
    void list_returnsAllWithoutFilters() throws Exception {
        entry(AuditEntityType.EVENT, AuditAction.CREATE);
        entry(AuditEntityType.MENU_ITEM, AuditAction.UPDATE);

        mockMvc.perform(get("/api/admin/audit").with(as("ad", AdminRole.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    void list_filtersByEntityType() throws Exception {
        entry(AuditEntityType.EVENT, AuditAction.CREATE);
        entry(AuditEntityType.MENU_ITEM, AuditAction.UPDATE);

        mockMvc.perform(get("/api/admin/audit").param("entityType", "EVENT").with(as("ad", AdminRole.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].entityType").value("EVENT"));
    }

    @Test
    void list_filtersByEntityTypeAndAction() throws Exception {
        entry(AuditEntityType.EVENT, AuditAction.CREATE);
        entry(AuditEntityType.EVENT, AuditAction.UPDATE);
        entry(AuditEntityType.MENU_ITEM, AuditAction.UPDATE);

        mockMvc.perform(get("/api/admin/audit")
                        .param("entityType", "EVENT")
                        .param("action", "UPDATE")
                        .with(as("ad", AdminRole.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].action").value("UPDATE"));
    }
}
