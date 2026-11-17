package cafe.community.backend.service;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.repository.AuditLogRepository;
import cafe.community.backend.service.audit.Audited;
import cafe.community.backend.service.audit.Snapshot;
import cafe.community.backend.util.AuditActorResolver;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central API for writing persistent audit entries. The actor is resolved
 * internally from the security context, so callers do not thread a principal
 * through their signatures.
 *
 * <p>Writes join the caller's transaction, so a change and its entry are saved together. A
 * failure here is logged rather than thrown, but a database that refuses the entry still marks
 * that transaction for rollback: the change is then not saved either, rather than saved without
 * a record of who made it.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /** Record a plain creation: "Created vacancy: Barista", with the fields it was created with. */
    public <T> void created(Audited<T> kind, T saved) {
        recordCreate(kind.type(), kind.id().apply(saved), kind.label().apply(saved),
                kind.snapshot(saved).asCreated(), "Created " + kind.noun() + ": " + kind.describe().apply(saved));
    }

    /** Record a plain update, from the fields taken before it ({@link Audited#snapshot}). */
    public <T> void updated(Audited<T> kind, Snapshot before, T saved) {
        recordUpdate(kind.type(), kind.id().apply(saved), kind.label().apply(saved),
                before.changesTo(kind.snapshot(saved)), "Updated " + kind.noun() + ": " + kind.describe().apply(saved));
    }

    /** Record a plain deletion, keeping its last values. Call it before deleting the entity. */
    public <T> void deleted(Audited<T> kind, T entity) {
        recordDelete(kind.type(), kind.id().apply(entity), kind.label().apply(entity),
                kind.snapshot(entity).asDeleted(), "Deleted " + kind.noun() + ": " + kind.describe().apply(entity));
    }

    /** Record a creation. {@code snapshot} may carry the initial field values, or be empty. */
    public void recordCreate(AuditEntityType entityType, Long entityId, String label,
                             List<FieldChange> snapshot, String summary) {
        record(entityType, entityId, label, AuditAction.CREATE, snapshot, summary);
    }

    /** Record an update. No-op when there are no field changes. */
    public void recordUpdate(AuditEntityType entityType, Long entityId, String label,
                             List<FieldChange> diffs, String summary) {
        if (diffs == null || diffs.isEmpty()) {
            return;
        }
        record(entityType, entityId, label, AuditAction.UPDATE, diffs, summary);
    }

    /** Record a deletion. */
    public void recordDelete(AuditEntityType entityType, Long entityId, String label, String summary) {
        record(entityType, entityId, label, AuditAction.DELETE, List.of(), summary);
    }

    /** Record a deletion, keeping the last values of the removed fields so it can be put back by hand. */
    public void recordDelete(AuditEntityType entityType, Long entityId, String label,
                             List<FieldChange> lastValues, String summary) {
        record(entityType, entityId, label, AuditAction.DELETE, lastValues, summary);
    }

    /** Record an arbitrary action with optional field changes. */
    public void recordAction(AuditEntityType entityType, Long entityId, String label,
                             AuditAction action, List<FieldChange> changes, String summary) {
        record(entityType, entityId, label, action, changes, summary);
    }

    private void record(AuditEntityType entityType, Long entityId, String label,
                        AuditAction action, List<FieldChange> changes, String summary) {
        try {
            AuditActorResolver.Actor actor = AuditActorResolver.resolveCurrentActor();

            AuditLog entry = new AuditLog();
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setEntityLabel(label);
            entry.setAction(action);
            entry.setActorOid(actor.oid());
            entry.setActorEmail(actor.email());
            entry.setActorName(actor.name());
            entry.setChanges(serialize(changes));
            entry.setSummary(summary);

            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Auditing must never break the underlying operation.
            log.error("Failed to write audit log entry: entityType={} action={} entityId={}",
                    entityType, action, entityId, e);
        }
    }

    private String serialize(List<FieldChange> changes) {
        if (changes == null || changes.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(changes);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit field changes", e);
            return null;
        }
    }
}
