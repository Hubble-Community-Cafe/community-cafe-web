package cafe.community.backend.repository;

import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /** All entries, newest first (paged) for the admin audit view. */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Entries for a single entity, newest first (per-entity history timeline). */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType entityType, Long entityId);
}
