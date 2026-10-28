package cafe.community.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

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

    /**
     * Per-module access; a module without an entry is hidden. Loaded eagerly because the role
     * filter reads it on every admin request. The database removes the rows with the user.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_user_permission", joinColumns = @JoinColumn(name = "admin_user_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "module", length = 30)
    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 10)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Map<AdminModule, AccessLevel> permissions = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Last time this account used the admin (at most a day off); drives inactive-account removal. */
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    /** Every module with the level this user effectively holds: EDIT everywhere for an admin. */
    public Map<AdminModule, AccessLevel> effectivePermissions() {
        Map<AdminModule, AccessLevel> effective = new EnumMap<>(AdminModule.class);
        for (AdminModule module : AdminModule.values()) {
            effective.put(module, role == AdminRole.ADMIN
                    ? AccessLevel.EDIT
                    : permissions.getOrDefault(module, AccessLevel.HIDDEN));
        }
        return effective;
    }

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
