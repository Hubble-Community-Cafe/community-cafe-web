package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * A privacy-minimised audit stub for a public form submission: it records only that a
 * submission of a given type happened, when, and whether a file was attached. No personal
 * data is stored here. The submitter's name, email and message live only in the notification
 * email sent to staff, and the uploaded file (poster/receipt) is never persisted.
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

    /** Whether a file was attached to the notification (the file itself is not stored). */
    @Column(nullable = false)
    private boolean hadAttachment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
