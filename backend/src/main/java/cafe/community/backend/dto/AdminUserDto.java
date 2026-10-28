package cafe.community.backend.dto;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;

import java.util.Map;

/**
 * The view of a staff/board user returned to the admin frontend. {@code permissions} is the
 * effective access with every module listed (EDIT everywhere for an admin, HIDDEN where nothing
 * is granted), so the frontend never has to fill gaps.
 */
public record AdminUserDto(Long id, String email, String displayName, AdminRole role, boolean admin,
                           Map<AdminModule, AccessLevel> permissions) {

    public static AdminUserDto from(AdminUser user) {
        return new AdminUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getRole() == AdminRole.ADMIN, user.effectivePermissions());
    }
}
