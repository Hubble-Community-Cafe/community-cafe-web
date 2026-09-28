package cafe.community.backend.service;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.model.FormSubmission;
import cafe.community.backend.model.FormType;
import cafe.community.backend.repository.AdminUserRepository;
import cafe.community.backend.repository.AuditLogRepository;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The retention rules against the real queries (H2), with the default periods: audit actor blanked
 * after 365 days and the entry deleted after 730, form submissions deleted after 730, accounts not
 * seen for 365 days deleted unless ADMIN. Timestamps are backdated with plain SQL, since the
 * entities stamp their own creation time.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DataRetentionServiceTest {

    @Autowired DataRetentionService dataRetentionService;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired FormSubmissionRepository formSubmissionRepository;
    @Autowired AdminUserRepository adminUserRepository;
    @Autowired JdbcTemplate jdbc;

    private final LocalDateTime now = LocalDateTime.now();

    @Test
    void auditEntriesLoseTheirActorAfterAYearAndDisappearAfterTwo() {
        long recent = audit(now.minusDays(30));
        long yearOld = audit(now.minusDays(400));
        long twoYearsOld = audit(now.minusDays(800));

        dataRetentionService.purge();

        Map<String, Object> recentRow = auditRow(recent);
        assertThat(recentRow.get("actor_email")).isEqualTo("staff@hubble.cafe");
        assertThat(recentRow.get("actor_name")).isEqualTo("Staff Member");

        Map<String, Object> yearOldRow = auditRow(yearOld);
        assertThat(yearOldRow.get("actor_oid")).isNull();
        assertThat(yearOldRow.get("actor_email")).isNull();
        assertThat(yearOldRow.get("actor_name")).isNull();
        assertThat(yearOldRow.get("summary")).as("the change itself is kept").isEqualTo("Updated the menu");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE id = ?", Long.class, twoYearsOld))
                .isZero();
    }

    @Test
    void formSubmissionRecordsAreDeletedAfterTwoYears() {
        long recent = formSubmission(now.minusDays(700));
        long old = formSubmission(now.minusDays(731));

        dataRetentionService.purge();

        assertThat(ids("form_submission")).contains(recent).doesNotContain(old);
    }

    @Test
    void inactiveAccountsAreRemovedButNeverAdminsOrAccountsWithoutALastSeenTime() {
        long activeViewer = adminUser("active", AdminRole.VIEWER, now.minusDays(10));
        long inactiveViewer = adminUser("gone-viewer", AdminRole.VIEWER, now.minusDays(400));
        long inactiveEditor = adminUser("gone-editor", AdminRole.EDITOR, now.minusDays(400));
        long inactivePoster = adminUser("gone-poster", AdminRole.DDD_POSTER, now.minusDays(400));
        long inactiveAdmin = adminUser("gone-admin", AdminRole.ADMIN, now.minusDays(400));
        long neverSeen = adminUser("never-seen", AdminRole.VIEWER, null);

        DataRetentionService.RetentionResult result = dataRetentionService.purge();

        assertThat(ids("admin_user"))
                .contains(activeViewer, inactiveAdmin, neverSeen)
                .doesNotContain(inactiveViewer, inactiveEditor, inactivePoster);
        assertThat(result.adminUsersDeleted()).isEqualTo(3);
    }

    private long audit(LocalDateTime createdAt) {
        AuditLog entry = new AuditLog();
        entry.setEntityType(AuditEntityType.MENU_ITEM);
        entry.setEntityId(1L);
        entry.setAction(AuditAction.UPDATE);
        entry.setActorOid("staff-oid");
        entry.setActorEmail("staff@hubble.cafe");
        entry.setActorName("Staff Member");
        entry.setSummary("Updated the menu");
        entry.setCreatedAt(createdAt);
        return auditLogRepository.saveAndFlush(entry).getId();
    }

    private Map<String, Object> auditRow(long id) {
        return jdbc.queryForMap("SELECT actor_oid, actor_email, actor_name, summary FROM audit_log WHERE id = ?", id);
    }

    private long formSubmission(LocalDateTime createdAt) {
        FormSubmission submission = new FormSubmission();
        submission.setType(FormType.COMPLAINT);
        long id = formSubmissionRepository.saveAndFlush(submission).getId();
        jdbc.update("UPDATE form_submission SET created_at = ? WHERE id = ?", createdAt, id);
        return id;
    }

    private long adminUser(String oid, AdminRole role, LocalDateTime lastSeenAt) {
        AdminUser user = new AdminUser();
        user.setAzureOid(oid);
        user.setEmail(oid + "@hubble.cafe");
        user.setRole(role);
        long id = adminUserRepository.saveAndFlush(user).getId();
        jdbc.update("UPDATE admin_user SET last_seen_at = ? WHERE id = ?", lastSeenAt, id);
        return id;
    }

    private List<Long> ids(String table) {
        return jdbc.queryForList("SELECT id FROM " + table, Long.class);
    }
}
