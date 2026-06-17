package cafe.community.backend.dto;

import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;

import java.time.LocalDateTime;

/** A read-only audit entry for the admin audit view. */
public record AuditLogDto(
        Long id,
        AuditEntityType entityType,
        Long entityId,
        String entityLabel,
        AuditAction action,
        String actorEmail,
        String actorName,
        String changes,
        String summary,
        LocalDateTime createdAt) {

    public static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(
                log.getId(), log.getEntityType(), log.getEntityId(), log.getEntityLabel(),
                log.getAction(), log.getActorEmail(), log.getActorName(), log.getChanges(),
                log.getSummary(), log.getCreatedAt());
    }
}
