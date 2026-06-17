package cafe.community.backend.service;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.initial-admin-oid=admin-oid")
class AdminUserServiceTest {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void getOrCreateUser_createsViewerByDefault() {
        AdminUser user = adminUserService.getOrCreateUser("u1", "u1@hubble.cafe", "User One");
        assertThat(user.getId()).isNotNull();
        assertThat(user.getRole()).isEqualTo(AdminRole.VIEWER);
    }

    @Test
    void getOrCreateUser_promotesTheInitialAdmin() {
        AdminUser user = adminUserService.getOrCreateUser("admin-oid", "boss@hubble.cafe", "Boss");
        assertThat(user.getRole()).isEqualTo(AdminRole.ADMIN);
    }

    @Test
    void getOrCreateUser_isIdempotentForTheSameOid() {
        AdminUser first = adminUserService.getOrCreateUser("u2", "u2@hubble.cafe", "Two");
        AdminUser second = adminUserService.getOrCreateUser("u2", "u2@hubble.cafe", "Two");
        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(adminUserService.getAllUsers()).hasSize(1);
    }

    @Test
    void updateRole_changesRoleAndWritesAudit() {
        AdminUser target = adminUserService.getOrCreateUser("u3", "u3@hubble.cafe", "Three");

        AdminUser updated = adminUserService.updateRole(target.getId(), AdminRole.EDITOR, "admin-oid");

        assertThat(updated.getRole()).isEqualTo(AdminRole.EDITOR);
        assertThat(auditLogRepository.findAll())
                .anyMatch(a -> a.getAction() == AuditAction.ROLE_CHANGED);
    }

    @Test
    void updateRole_rejectsChangingYourOwnRole() {
        AdminUser self = adminUserService.getOrCreateUser("self-oid", "self@hubble.cafe", "Self");
        assertThatThrownBy(() -> adminUserService.updateRole(self.getId(), AdminRole.ADMIN, "self-oid"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("own role");
    }
}
