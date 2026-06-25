package cafe.community.backend.controller;

import cafe.community.backend.dto.AuditLogDto;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only access to the audit trail (admin only). */
@RestController
@RequestMapping("/api/admin/audit")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditLogDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) AuditEntityType entityType,
            @RequestParam(required = false) AuditAction action) {
        int capped = Math.min(Math.max(size, 1), 200);
        return auditLogRepository
                .findFiltered(entityType, action, PageRequest.of(Math.max(page, 0), capped))
                .map(AuditLogDto::from);
    }
}
