package cafe.community.backend.repository;

import cafe.community.backend.model.FormSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface FormSubmissionRepository extends JpaRepository<FormSubmission, Long> {

    /** Data retention: delete submission records older than {@code cutoff}. */
    @Transactional
    @Modifying
    @Query("DELETE FROM FormSubmission f WHERE f.createdAt < :cutoff")
    int deleteCreatedBefore(@Param("cutoff") LocalDateTime cutoff);
}
