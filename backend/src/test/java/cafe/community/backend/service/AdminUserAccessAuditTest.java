package cafe.community.backend.service;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.repository.AdminUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Not @Transactional itself: it checks what the service commits. An access change used to be
 * saved on its own, so when the database refused its audit entry, AuditService logged that and
 * the change stayed, unrecorded.
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminUserAccessAuditTest {

    @Autowired AdminUserService adminUserService;
    @Autowired AdminUserRepository adminUserRepository;
    @Autowired JdbcTemplate jdbc;

    @AfterEach
    void removeUsers() {
        adminUserRepository.findByAzureOid("atomic-target").ifPresent(adminUserRepository::delete);
    }

    @Test
    void anAccessChangeDoesNotStickWhenTheDatabaseRefusesItsAuditEntry() {
        AdminUser target = adminUserService.getOrCreateUser("atomic-target", "target@hubble.cafe", "Target");

        // A real refusal of the audit insert: the table is briefly not there.
        jdbc.execute("ALTER TABLE audit_log RENAME TO audit_log_unavailable");
        try {
            assertThatThrownBy(() -> adminUserService.updateAccess(target.getId(), false,
                    Map.of(AdminModule.EVENTS, AccessLevel.EDIT), "someone-else"));
        } finally {
            jdbc.execute("ALTER TABLE audit_log_unavailable RENAME TO audit_log");
        }

        AdminUser stored = adminUserRepository.findByAzureOid("atomic-target").orElseThrow();
        assertThat(stored.getRole()).isEqualTo(AdminRole.STAFF);
        assertThat(stored.effectivePermissions().get(AdminModule.EVENTS)).isEqualTo(AccessLevel.HIDDEN);
    }
}
