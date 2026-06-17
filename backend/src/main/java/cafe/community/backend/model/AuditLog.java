package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * A persistent, queryable record of a single change made to an audited entity:
 * who changed what, when, with field-level diffs stored as a JSON array in
 * {@link #changes}. {@link #entityLabel} keeps the entry readable even after the
 * referenced entity has been deleted.
 */
@Data
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private AuditEntityType entityType;

    /** The id of the changed entity (nullable: it may since have been deleted). */
    @Column(name = "entity_id")
    private Long entityId;

    /** Human-friendly label so the entry stays readable after the entity is gone. */
    @Column(name = "entity_label", length = 255)
    private String entityLabel;

    @Column(name = "action", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @Column(name = "actor_oid", length = 255)
    private String actorOid;

    @Column(name = "actor_email", length = 255)
    private String actorEmail;

    /** Display name of the actor (or "system" for non-user actions). */
    @Column(name = "actor_name", length = 255)
    private String actorName;

    /** JSON array of {@link cafe.community.backend.dto.FieldChange}; null when no field diffs. */
    @Column(name = "changes", columnDefinition = "TEXT")
    private String changes;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
