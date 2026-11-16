package cafe.community.backend;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AccessPreset;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.repository.AdminUserRepository;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/**
 * Signed-in staff for MockMvc tests: a token for an Entra object id, optionally with the user row
 * seeded first so the role filter finds their access.
 *
 * <p>Seeding always uses {@code saveAndFlush}: the filter's last-seen update clears the persistence
 * context, which would silently drop permission rows that were not written yet.
 */
public final class TestUsers {

    private TestUsers() {
    }

    /** A token for this object id. The user row is created on first use, without any access. */
    public static RequestPostProcessor token(String oid) {
        return jwt().jwt(j -> j.claim("oid", oid)
                .claim("preferred_username", oid + "@test.invalid")
                .claim("name", oid));
    }

    /** A staff member with one of the access presets (Viewer, DDD poster, Editor). */
    public static RequestPostProcessor withPreset(AdminUserRepository users, String oid, AccessPreset preset) {
        AdminUser user = newUser(oid);
        preset.applyTo(user);
        users.saveAndFlush(user);
        return token(oid);
    }

    /** A staff member with exactly these permissions and nothing else. */
    public static RequestPostProcessor withAccess(AdminUserRepository users, String oid,
                                                  Map<AdminModule, AccessLevel> permissions) {
        AdminUser user = newUser(oid);
        user.setRole(AdminRole.STAFF);
        user.getPermissions().putAll(permissions);
        users.saveAndFlush(user);
        return token(oid);
    }

    /** An admin, who may manage users and read the audit log. */
    public static RequestPostProcessor admin(AdminUserRepository users, String oid) {
        AdminUser user = newUser(oid);
        user.setRole(AdminRole.ADMIN);
        users.saveAndFlush(user);
        return token(oid);
    }

    private static AdminUser newUser(String oid) {
        AdminUser user = new AdminUser();
        user.setAzureOid(oid);
        user.setEmail(oid + "@test.invalid");
        user.setDisplayName(oid);
        return user;
    }
}
