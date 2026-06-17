package cafe.community.backend.dto;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;

/** The view of a staff/board user returned to the admin frontend. */
public record AdminUserDto(Long id, String email, String displayName, AdminRole role) {

    public static AdminUserDto from(AdminUser user) {
        return new AdminUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
