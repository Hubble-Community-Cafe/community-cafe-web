package cafe.community.backend.service;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditServiceTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void recordCreate_persistsEntryWithSystemActor() {
        auditService.recordCreate(AuditEntityType.ADMIN_USER, 1L, "alice@hubble.cafe",
                List.of(new FieldChange("role", null, "VIEWER")), "Created alice");

        List<AuditLog> all = auditLogRepository.findAll();
        assertThat(all).hasSize(1);
        AuditLog entry = all.get(0);
        assertThat(entry.getEntityType()).isEqualTo(AuditEntityType.ADMIN_USER);
        assertThat(entry.getActorName()).isEqualTo("system");
        assertThat(entry.getChanges()).contains("\"role\"").contains("VIEWER");
        assertThat(entry.getCreatedAt()).isNotNull();
    }

    @Test
    void recordUpdate_withNoChanges_isNoOp() {
        auditService.recordUpdate(AuditEntityType.ADMIN_USER, 1L, "alice", List.of(), "no change");
        assertThat(auditLogRepository.count()).isZero();
    }
}
