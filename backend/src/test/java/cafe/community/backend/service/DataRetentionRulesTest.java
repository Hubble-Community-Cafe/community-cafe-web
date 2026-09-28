package cafe.community.backend.service;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.repository.AdminUserRepository;
import cafe.community.backend.repository.AuditLogRepository;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Cut-off dates, switching rules off, and one failing rule not stopping the rest, on a fixed clock. */
class DataRetentionRulesTest {

    private static final ZoneId AMSTERDAM = ZoneId.of("Europe/Amsterdam");
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-28T01:30:00Z"), AMSTERDAM);
    private final LocalDateTime now = LocalDateTime.of(2026, 9, 28, 3, 30);

    private final AuditLogRepository audit = mock(AuditLogRepository.class);
    private final FormSubmissionRepository forms = mock(FormSubmissionRepository.class);
    private final AdminUserRepository users = mock(AdminUserRepository.class);

    private DataRetentionService service(int anonymise, int delete, int formDays, int userDays) {
        return new DataRetentionService(audit, forms, users, anonymise, delete, formDays, userDays, clock);
    }

    @Test
    void eachRuleUsesItsOwnCutoffAndAdminsAreKept() {
        when(audit.anonymiseActorsBefore(any())).thenReturn(4);
        when(audit.deleteCreatedBefore(any())).thenReturn(3);
        when(forms.deleteCreatedBefore(any())).thenReturn(2);
        when(users.deleteInactiveSince(any(), any())).thenReturn(1);

        DataRetentionService.RetentionResult result = service(365, 730, 730, 365).purge();

        verify(audit).anonymiseActorsBefore(now.minusDays(365));
        verify(audit).deleteCreatedBefore(now.minusDays(730));
        verify(forms).deleteCreatedBefore(now.minusDays(730));
        verify(users).deleteInactiveSince(now.minusDays(365), AdminRole.ADMIN);
        assertThat(result).isEqualTo(new DataRetentionService.RetentionResult(4, 3, 2, 1));
    }

    @Test
    void zeroSwitchesARuleOff() {
        DataRetentionService.RetentionResult result = service(0, 0, 0, 0).purge();

        verifyNoInteractions(audit, forms, users);
        assertThat(result).isEqualTo(new DataRetentionService.RetentionResult(-1, -1, -1, -1));
    }

    @Test
    void aFailingRuleDoesNotStopTheOthers() {
        when(audit.anonymiseActorsBefore(any())).thenThrow(new DataAccessResourceFailureException("db down"));
        when(audit.deleteCreatedBefore(any())).thenReturn(3);
        when(forms.deleteCreatedBefore(any())).thenReturn(2);
        when(users.deleteInactiveSince(any(), any())).thenReturn(1);

        DataRetentionService.RetentionResult result = service(365, 730, 730, 365).purge();

        assertThat(result).isEqualTo(new DataRetentionService.RetentionResult(-1, 3, 2, 1));
    }
}
