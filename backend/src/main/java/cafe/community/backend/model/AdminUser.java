package cafe.community.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * A staff/board member who may sign in to the admin. Access is gated by an Entra
 * security group; this row holds the in-app role. Auto-created on first login
 * (VIEWER, or ADMIN when the Azure OID matches {@code app.initial-admin-oid}).
 */
@Data
@Entity
@Table(name = "admin_user")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank
    @Column(name = "azure_oid", nullable = false, unique = true)
    private String azureOid;

    @NotBlank
    @Email
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "display_name")
    private String displayName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AdminRole role = AdminRole.VIEWER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
