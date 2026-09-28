package cafe.community.backend.service;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.repository.AdminUserRepository;
import cafe.community.backend.repository.AuditLogRepository;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.function.ToIntFunction;

/**
 * Removes personal data that is no longer needed, nightly. Each period is configurable
 * ({@code app.data.retention.*}, in days) and 0 switches that rule off:
 * <ul>
 *   <li>audit log: who made a change (name, email, OID) is blanked after {@code audit-anonymise-days},
 *       the entry itself deleted after {@code audit-delete-days};</li>
 *   <li>form submission records (type, date, attachment flag; no personal data) are deleted after
 *       {@code form-submission-days};</li>
 *   <li>staff/board accounts not seen for {@code inactive-admin-user-days} are deleted, except ADMIN
 *       accounts, so the app can never lose its last administrator. A removed person who signs in
 *       again is provisioned afresh as VIEWER.</li>
 * </ul>
 * Each rule runs in its own transaction, so one failing does not stop the others. Every run logs
 * one line with the counts (never names or emails).
 */
@Service
public class DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);

    /** Counts of one run; -1 means the rule is switched off or failed. */
    public record RetentionResult(int auditAnonymised, int auditDeleted, int formSubmissionsDeleted,
                                  int adminUsersDeleted) {
    }

    private final AuditLogRepository auditLogRepository;
    private final FormSubmissionRepository formSubmissionRepository;
    private final AdminUserRepository adminUserRepository;
    private final int auditAnonymiseDays;
    private final int auditDeleteDays;
    private final int formSubmissionDays;
    private final int inactiveAdminUserDays;
    private final Clock clock;

    @Autowired
    public DataRetentionService(AuditLogRepository auditLogRepository,
                                FormSubmissionRepository formSubmissionRepository,
                                AdminUserRepository adminUserRepository,
                                @Value("${app.data.retention.audit-anonymise-days:365}") int auditAnonymiseDays,
                                @Value("${app.data.retention.audit-delete-days:730}") int auditDeleteDays,
                                @Value("${app.data.retention.form-submission-days:730}") int formSubmissionDays,
                                @Value("${app.data.retention.inactive-admin-user-days:365}") int inactiveAdminUserDays) {
        this(auditLogRepository, formSubmissionRepository, adminUserRepository, auditAnonymiseDays,
                auditDeleteDays, formSubmissionDays, inactiveAdminUserDays, Clock.systemDefaultZone());
    }

    /** Package-private: lets tests pin the clock so the cut-off dates are deterministic. */
    DataRetentionService(AuditLogRepository auditLogRepository,
                         FormSubmissionRepository formSubmissionRepository,
                         AdminUserRepository adminUserRepository,
                         int auditAnonymiseDays, int auditDeleteDays, int formSubmissionDays,
                         int inactiveAdminUserDays, Clock clock) {
        this.auditLogRepository = auditLogRepository;
        this.formSubmissionRepository = formSubmissionRepository;
        this.adminUserRepository = adminUserRepository;
        this.auditAnonymiseDays = auditAnonymiseDays;
        this.auditDeleteDays = auditDeleteDays;
        this.formSubmissionDays = formSubmissionDays;
        this.inactiveAdminUserDays = inactiveAdminUserDays;
        this.clock = clock;
    }

    /** Nightly, at a quiet hour (the container runs on Europe/Amsterdam time). */
    @Scheduled(cron = "${app.data.retention.cron:0 30 3 * * *}")
    public RetentionResult purge() {
        LocalDateTime now = LocalDateTime.now(clock);
        RetentionResult result = new RetentionResult(
                apply("audit_anonymise", auditAnonymiseDays, now, auditLogRepository::anonymiseActorsBefore),
                apply("audit_delete", auditDeleteDays, now, auditLogRepository::deleteCreatedBefore),
                apply("form_submission_delete", formSubmissionDays, now,
                        formSubmissionRepository::deleteCreatedBefore),
                apply("admin_user_delete", inactiveAdminUserDays, now,
                        cutoff -> adminUserRepository.deleteInactiveSince(cutoff, AdminRole.ADMIN)));
        log.info("event=data_retention audit_anonymised={} audit_deleted={} form_submissions_deleted={} "
                        + "admin_users_deleted={}", result.auditAnonymised(), result.auditDeleted(),
                result.formSubmissionsDeleted(), result.adminUsersDeleted());
        return result;
    }

    private int apply(String rule, int days, LocalDateTime now, ToIntFunction<LocalDateTime> action) {
        if (days <= 0) {
            return -1;
        }
        try {
            return action.applyAsInt(now.minusDays(days));
        } catch (RuntimeException e) {
            log.error("Data retention rule {} failed; the other rules still ran", rule, e);
            return -1;
        }
    }
}
