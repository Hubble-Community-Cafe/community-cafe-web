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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

/**
 * Not @Transactional itself: it checks what the service commits. An access change used to be
 * saved before its audit entry, so a failing audit write left the change in place, unrecorded.
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminUserAccessAuditTest {

    @Autowired AdminUserService adminUserService;
    @Autowired AdminUserRepository adminUserRepository;
    @MockitoSpyBean AuditService auditService;

    @AfterEach
    void removeUsers() {
        adminUserRepository.findByAzureOid("atomic-target").ifPresent(adminUserRepository::delete);
    }

    @Test
    void anAccessChangeDoesNotStickWhenItsAuditEntryFails() {
        AdminUser target = adminUserService.getOrCreateUser("atomic-target", "target@hubble.cafe", "Target");
        doThrow(new IllegalStateException("audit log unavailable"))
                .when(auditService).recordAction(any(), any(), any(), any(), any(), any());

        assertThatThrownBy(() -> adminUserService.updateAccess(target.getId(), false,
                Map.of(AdminModule.EVENTS, AccessLevel.EDIT), "someone-else"))
                .hasMessage("audit log unavailable");

        AdminUser stored = adminUserRepository.findByAzureOid("atomic-target").orElseThrow();
        assertThat(stored.getRole()).isEqualTo(AdminRole.STAFF);
        assertThat(stored.effectivePermissions().get(AdminModule.EVENTS)).isEqualTo(AccessLevel.HIDDEN);
    }
}
