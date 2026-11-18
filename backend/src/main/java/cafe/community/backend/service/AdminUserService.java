package cafe.community.backend.service;

import java.time.Clock;
import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.repository.AdminUserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Manages staff/board users. Users are auto-provisioned on first login (gated by
 * the Entra security group at the edge): STAFF without access to any tab by default, or ADMIN
 * when their Azure OID matches {@code app.initial-admin-oid} to bootstrap the first admin.
 */
@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final AdminUserRepository adminUserRepository;
    private final AuditService auditService;
    private final String initialAdminOid;
    private final Clock clock;

    public AdminUserService(
            AdminUserRepository adminUserRepository,
            AuditService auditService,
            @Value("${app.initial-admin-oid:}") String initialAdminOid,
            Clock clock) {
        this.adminUserRepository = adminUserRepository;
        this.auditService = auditService;
        this.initialAdminOid = initialAdminOid;
        this.clock = clock;
    }

    /** Find by Azure OID or create a new user (STAFF without access, or ADMIN for the initial admin). */
    public AdminUser getOrCreateUser(String azureOid, String email, String displayName) {
        return adminUserRepository.findByAzureOid(azureOid)
                .map(existing -> {
                    updateIfChanged(existing, email, displayName);
                    touchLastSeen(existing);
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

    /**
     * Set a user's admin switch and per-module access. An admin stores no permissions (they hold
     * every module); anyone else becomes STAFF with exactly the given levels, hidden ones left out.
     * Refuses changing your own access, so there is always another admin involved, and a view-only
     * level on Screen posters, which is a yes/no setting.
     *
     * <p>One transaction with its audit entry: an access change never sticks without a record of
     * who changed it. (getOrCreateUser stays outside one on purpose: it swallows a lost concurrent
     * write, which inside a transaction would still roll the request back.)
     */
    @Transactional
    public AdminUser updateAccess(Long userId, boolean admin, Map<AdminModule, AccessLevel> permissions,
                                  String requestingUserOid) {
        AdminUser target = adminUserRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        if (target.getAzureOid().equals(requestingUserOid)) {
            throw new IllegalArgumentException("Cannot change your own access");
        }
        if (permissions.get(AdminModule.SCREEN_POSTERS) == AccessLevel.VIEW) {
            throw new IllegalArgumentException("Screen posters can only be hidden or editable");
        }

        Map<AdminModule, AccessLevel> granted = new EnumMap<>(AdminModule.class);
        if (!admin) {
            permissions.forEach((module, level) -> {
                if (module != null && level != null && level != AccessLevel.HIDDEN) {
                    granted.put(module, level);
                }
            });
        }

        boolean wasAdmin = target.getRole() == AdminRole.ADMIN;
        Map<AdminModule, AccessLevel> before = target.effectivePermissions();
        target.setRole(admin ? AdminRole.ADMIN : AdminRole.STAFF);
        target.getPermissions().clear();
        target.getPermissions().putAll(granted);
        Map<AdminModule, AccessLevel> after = target.effectivePermissions();

        List<FieldChange> changes = new ArrayList<>();
        if (wasAdmin != admin) {
            changes.add(new FieldChange("admin", String.valueOf(wasAdmin), String.valueOf(admin)));
        }
        for (AdminModule module : AdminModule.values()) {
            if (before.get(module) != after.get(module)) {
                changes.add(new FieldChange(module.name(), before.get(module).name(), after.get(module).name()));
            }
        }

        AdminUser saved = adminUserRepository.save(target);
        if (!changes.isEmpty()) {
            auditService.recordAction(AuditEntityType.ADMIN_USER, userId, saved.getEmail(),
                    AuditAction.PERMISSIONS_CHANGED, changes, "Access changed for " + saved.getEmail());
        }
        return saved;
    }

    private AdminUser createUser(String azureOid, String email, String displayName) {
        AdminUser user = new AdminUser();
        user.setAzureOid(azureOid);
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setLastSeenAt(LocalDateTime.now(clock));

        boolean isInitialAdmin = initialAdminOid != null && !initialAdminOid.isBlank()
                && initialAdminOid.equals(azureOid);
        // Everyone else starts without access to any tab until an admin grants it.
        user.setRole(isInitialAdmin ? AdminRole.ADMIN : AdminRole.STAFF);

        AdminUser saved = adminUserRepository.save(user);
        // The object id, not the email: personal data stays out of the logs.
        log.info("Provisioned admin user oid={} role={}", saved.getAzureOid(), saved.getRole());
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
            adminUserRepository.updateIdentity(user.getId(), newEmail, newDisplayName, LocalDateTime.now(clock));
            user.setEmail(newEmail);
            user.setDisplayName(newDisplayName);
        } catch (DataAccessException e) {
            // A concurrent request is writing the same values; the row still ends up correct.
            log.debug("Skipped identity refresh for oid={}, lost a concurrent write", user.getAzureOid(), e);
        }
    }

    /**
     * Record that the user is active, for the inactive-account retention rule. Written at most once
     * a day per user, since this runs on every admin request. Best effort for the same reason as
     * {@link #updateIfChanged}: a lost concurrent write only means another request already stored
     * a moment later.
     */
    private void touchLastSeen(AdminUser user) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (user.getLastSeenAt() != null && user.getLastSeenAt().isAfter(now.minusDays(1))) {
            return;
        }
        try {
            adminUserRepository.updateLastSeen(user.getId(), now);
            user.setLastSeenAt(now);
        } catch (DataAccessException e) {
            log.debug("Skipped last-seen update for oid={}, lost a concurrent write", user.getAzureOid(), e);
        }
    }
}
