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
import org.springframework.stereotype.Service;

import java.util.List;

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

    private void updateIfChanged(AdminUser user, String email, String displayName) {
        boolean changed = false;
        if (email != null && !email.equals(user.getEmail())) {
            user.setEmail(email);
            changed = true;
        }
        if (displayName != null && !displayName.equals(user.getDisplayName())) {
            user.setDisplayName(displayName);
            changed = true;
        }
        if (changed) {
            adminUserRepository.save(user);
        }
    }
}
