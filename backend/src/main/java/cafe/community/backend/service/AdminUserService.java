package cafe.community.backend.service;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Manages staff/board users. Users are auto-provisioned on first login (gated by
 * the Entra security group at the edge): VIEWER by default, or ADMIN when their
 * Azure OID matches {@code app.initial-admin-oid} to bootstrap the first admin.
 */
@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserRepository adminUserRepository;
    private final AuditService auditService;
    private final String initialAdminOid;

    public AdminUserService(
            AdminUserRepository adminUserRepository,
            AuditService auditService,
            @Value("${app.initial-admin-oid:}") String initialAdminOid) {
        this.adminUserRepository = adminUserRepository;
        this.auditService = auditService;
        this.initialAdminOid = initialAdminOid;
    }

    /** Find by Azure OID or create a new user (VIEWER, or ADMIN for the initial admin). */
    public AdminUser getOrCreateUser(String azureOid, String email, String displayName) {
        return adminUserRepository.findByAzureOid(azureOid)
                .map(existing -> {
                    updateIfChanged(existing, email, displayName);
                    return existing;
                })
                .orElseGet(() -> createUser(azureOid, email, displayName));
    }

    public AdminUser getCurrentUser(String azureOid) {
        return adminUserRepository.findByAzureOid(azureOid).orElse(null);
    }

    public List<AdminUser> getAllUsers() {
        return adminUserRepository.findAll();
    }

    /** Update a user's role. Prevents an admin from changing their own role. */
    public AdminUser updateRole(Long userId, AdminRole newRole, String requestingUserOid) {
        AdminUser target = adminUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (target.getAzureOid().equals(requestingUserOid)) {
            throw new IllegalArgumentException("Cannot change your own role");
        }

        AdminRole oldRole = target.getRole();
        target.setRole(newRole);
        AdminUser saved = adminUserRepository.save(target);

        auditService.recordAction(AuditEntityType.ADMIN_USER, userId, saved.getEmail(),
                AuditAction.ROLE_CHANGED,
                List.of(new FieldChange("role", String.valueOf(oldRole), String.valueOf(newRole))),
                "Role changed for " + saved.getEmail());

        return saved;
    }

    private AdminUser createUser(String azureOid, String email, String displayName) {
        AdminUser user = new AdminUser();
        user.setAzureOid(azureOid);
        user.setEmail(email);
        user.setDisplayName(displayName);

        boolean isInitialAdmin = initialAdminOid != null && !initialAdminOid.isBlank()
                && initialAdminOid.equals(azureOid);
        user.setRole(isInitialAdmin ? AdminRole.ADMIN : AdminRole.VIEWER);

        AdminUser saved = adminUserRepository.save(user);
        log.info("Provisioned admin user email='{}' role={}", email, saved.getRole());
        return saved;
    }

    /**
     * Mirror the token's email and display name onto the stored row when they have drifted.
     *
     * <p>Best effort on purpose. This runs in the auth filter on every admin request, so when a
     * name changes in Entra the next burst of concurrent requests all try to write the same new
     * values at once. MariaDB 11.6+ defaults {@code innodb_snapshot_isolation} to ON, which turns
     * a concurrent read-then-write on one row into error 1020 ("Record has changed since last
     * read") rather than serialising it, so the losers of that race would otherwise fail the whole
     * request with a 500.
     *
     * <p>Losing the race is harmless: every racer is writing identical values, and whoever wins
     * has already stored them. So we swallow the failure and carry on serving the request.
     */
    private void updateIfChanged(AdminUser user, String email, String displayName) {
        String newEmail = email != null ? email : user.getEmail();
        String newDisplayName = displayName != null ? displayName : user.getDisplayName();

        boolean changed = !newEmail.equals(user.getEmail())
                || !Objects.equals(newDisplayName, user.getDisplayName());
        if (!changed) {
            return;
        }

        try {
            adminUserRepository.updateIdentity(user.getId(), newEmail, newDisplayName, LocalDateTime.now());
            user.setEmail(newEmail);
            user.setDisplayName(newDisplayName);
        } catch (DataAccessException e) {
            // A concurrent request is writing the same values; the row still ends up correct.
            log.debug("Skipped identity refresh for oid={}, lost a concurrent write", user.getAzureOid(), e);
        }
    }
}
