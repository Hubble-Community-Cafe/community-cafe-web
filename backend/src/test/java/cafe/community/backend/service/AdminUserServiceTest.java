package cafe.community.backend.service;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AccessPresets;
import cafe.community.backend.model.AdminModule;
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
import java.util.Map;

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
    void getOrCreateUser_createsStaffWithoutAccessByDefault() {
        AdminUser user = adminUserService.getOrCreateUser("u1", "u1@hubble.cafe", "User One");
        assertThat(user.getId()).isNotNull();
        assertThat(user.getRole()).isEqualTo(AdminRole.STAFF);
        assertThat(user.getPermissions()).isEmpty();
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
        assertThat(updated.getPermissions()).isEqualTo(AccessPresets.forRole(AdminRole.EDITOR));
        assertThat(auditLogRepository.findAll())
                .anyMatch(a -> a.getAction() == AuditAction.ROLE_CHANGED);
    }

    @Test
    void updateRole_toAdminStoresNoPermissions() {
        AdminUser target = adminUserService.getOrCreateUser("u4", "u4@hubble.cafe", "Four");

        adminUserService.updateRole(target.getId(), AdminRole.ADMIN, "admin-oid");
        entityManager.flush();
        entityManager.clear();

        assertThat(adminUserService.getCurrentUser("u4").getPermissions()).isEmpty();
    }

    @Test
    void updateAccess_storesOnlyGrantedModulesAndMakesTheUserStaff() {
        AdminUser target = adminUserService.getOrCreateUser("u5", "u5@hubble.cafe", "Five");

        AdminUser updated = adminUserService.updateAccess(target.getId(), false, Map.of(
                AdminModule.EVENTS, AccessLevel.EDIT,
                AdminModule.MENU, AccessLevel.VIEW,
                AdminModule.BOARD, AccessLevel.HIDDEN), "admin-oid");

        assertThat(updated.getRole()).isEqualTo(AdminRole.STAFF);
        assertThat(updated.getPermissions()).containsOnly(
                Map.entry(AdminModule.EVENTS, AccessLevel.EDIT),
                Map.entry(AdminModule.MENU, AccessLevel.VIEW));
    }

    @Test
    void updateAccess_auditsEachChangedModule() {
        AdminUser target = adminUserService.getOrCreateUser("u6", "u6@hubble.cafe", "Six");
        adminUserService.updateRole(target.getId(), AdminRole.VIEWER, "admin-oid");
        auditLogRepository.deleteAll();
        Map<AdminModule, AccessLevel> viewer = AccessPresets.forRole(AdminRole.VIEWER);
        Map<AdminModule, AccessLevel> changed = new java.util.EnumMap<>(viewer);
        changed.put(AdminModule.EVENTS, AccessLevel.EDIT);
        changed.remove(AdminModule.MEDIA);

        adminUserService.updateAccess(target.getId(), false, changed, "admin-oid");

        assertThat(auditLogRepository.findAll()).singleElement().satisfies(entry -> {
            assertThat(entry.getAction()).isEqualTo(AuditAction.PERMISSIONS_CHANGED);
            assertThat(entry.getChanges())
                    .contains("\"field\":\"EVENTS\",\"oldValue\":\"VIEW\",\"newValue\":\"EDIT\"")
                    .contains("\"field\":\"MEDIA\",\"oldValue\":\"VIEW\",\"newValue\":\"HIDDEN\"")
                    .doesNotContain("MENU");
        });
    }

    @Test
    void updateAccess_withoutAnyChangeWritesNoAudit() {
        AdminUser target = adminUserService.getOrCreateUser("u7", "u7@hubble.cafe", "Seven");
        adminUserService.updateRole(target.getId(), AdminRole.VIEWER, "admin-oid");
        auditLogRepository.deleteAll();

        adminUserService.updateAccess(target.getId(), false, AccessPresets.forRole(AdminRole.VIEWER), "admin-oid");

        assertThat(auditLogRepository.findAll()).isEmpty();
    }

    @Test
    void updateAccess_adminDropsStoredPermissionsAndAuditsTheSwitch() {
        AdminUser target = adminUserService.getOrCreateUser("u8", "u8@hubble.cafe", "Eight");
        auditLogRepository.deleteAll();

        AdminUser updated = adminUserService.updateAccess(target.getId(), true,
                Map.of(AdminModule.MENU, AccessLevel.VIEW), "admin-oid");

        assertThat(updated.getRole()).isEqualTo(AdminRole.ADMIN);
        assertThat(updated.getPermissions()).isEmpty();
        assertThat(updated.effectivePermissions()).containsValue(AccessLevel.EDIT).doesNotContainValue(AccessLevel.VIEW);
        assertThat(auditLogRepository.findAll()).singleElement()
                .satisfies(entry -> assertThat(entry.getChanges())
                        .contains("\"field\":\"admin\",\"oldValue\":\"false\",\"newValue\":\"true\""));
    }

    @Test
    void updateAccess_rejectsChangingYourOwnAccess() {
        AdminUser self = adminUserService.getOrCreateUser("self-2", "self2@hubble.cafe", "Self");
        assertThatThrownBy(() -> adminUserService.updateAccess(self.getId(), true, Map.of(), "self-2"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("own access");
    }

    @Test
    void updateAccess_rejectsViewOnlyScreenPosters() {
        AdminUser target = adminUserService.getOrCreateUser("u9", "u9@hubble.cafe", "Nine");
        assertThatThrownBy(() -> adminUserService.updateAccess(target.getId(), false,
                Map.of(AdminModule.SCREEN_POSTERS, AccessLevel.VIEW), "admin-oid"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Screen posters");
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
