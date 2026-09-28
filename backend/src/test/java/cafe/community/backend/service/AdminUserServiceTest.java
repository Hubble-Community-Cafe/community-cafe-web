package cafe.community.backend.service;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.repository.AuditLogRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private EntityManager entityManager;

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

    @Test
    void getOrCreateUser_recordsWhenANewUserWasLastSeen() {
        AdminUser user = adminUserService.getOrCreateUser("seen-1", "seen1@hubble.cafe", "Seen");

        assertThat(lastSeen(user.getId())).isAfter(LocalDateTime.now().minusMinutes(1));
    }

    @Test
    void getOrCreateUser_refreshesAStaleLastSeenTime() {
        AdminUser user = adminUserService.getOrCreateUser("seen-2", "seen2@hubble.cafe", "Seen");
        jdbc.update("UPDATE admin_user SET last_seen_at = ? WHERE id = ?", LocalDateTime.now().minusDays(3), user.getId());
        entityManager.clear(); // as on a new request: reload the row instead of the cached entity

        adminUserService.getOrCreateUser("seen-2", "seen2@hubble.cafe", "Seen");

        assertThat(lastSeen(user.getId())).isAfter(LocalDateTime.now().minusMinutes(1));
    }

    @Test
    void getOrCreateUser_writesTheLastSeenTimeAtMostOnceADay() {
        AdminUser user = adminUserService.getOrCreateUser("seen-3", "seen3@hubble.cafe", "Seen");
        LocalDateTime earlierToday = LocalDateTime.now().minusHours(2).withNano(0);
        jdbc.update("UPDATE admin_user SET last_seen_at = ? WHERE id = ?", earlierToday, user.getId());
        entityManager.clear();

        adminUserService.getOrCreateUser("seen-3", "seen3@hubble.cafe", "Seen");

        assertThat(lastSeen(user.getId())).isEqualTo(earlierToday);
    }

    private LocalDateTime lastSeen(Long id) {
        return jdbc.queryForObject("SELECT last_seen_at FROM admin_user WHERE id = ?", LocalDateTime.class, id);
    }
}
