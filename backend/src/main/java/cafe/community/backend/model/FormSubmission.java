package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * An audit record of a public form submission. Stores the submitted field values as a
 * plain-text summary plus metadata; the uploaded file (poster/receipt) is emailed to staff
 * but deliberately NOT persisted here (privacy-first: no server-side retention of receipts).
 */
@Data
@Entity
@Table(name = "form_submission")
public class FormSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FormType type;

    @Column(length = 200)
    private String submitterName;

    @Column(length = 200)
    private String submitterEmail;

    /** Whether a file was attached to the notification (the file itself is not stored). */
    @Column(nullable = false)
    private boolean hadAttachment;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
