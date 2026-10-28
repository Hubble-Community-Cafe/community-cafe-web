package cafe.community.backend.model;

import java.util.EnumMap;
import java.util.Map;

/**
 * The per-module access that matches each of the old hierarchical roles. Used to keep the stored
 * permissions in step with the role while both exist, and as the one-click presets for admins.
 * Must stay identical to the backfill in {@code V4__admin_user_permission.sql}.
 */
public final class AccessPresets {

    private static final AdminModule[] CONTENT = {
            AdminModule.MENU, AdminModule.DAILY_DISH, AdminModule.OPENING_HOURS, AdminModule.EVENTS,
            AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS, AdminModule.MEDIA,
    };

    private AccessPresets() {
    }

    /** The permissions of a role. Admins hold every module through the admin switch, so none are stored. */
    public static Map<AdminModule, AccessLevel> forRole(AdminRole role) {
        Map<AdminModule, AccessLevel> permissions = new EnumMap<>(AdminModule.class);
        if (role == AdminRole.ADMIN) {
            return permissions;
        }
        AccessLevel content = role == AdminRole.EDITOR ? AccessLevel.EDIT : AccessLevel.VIEW;
        for (AdminModule module : CONTENT) {
            permissions.put(module, content);
        }
        if (role == AdminRole.DDD_POSTER) {
            permissions.put(AdminModule.DAILY_DISH, AccessLevel.EDIT);
        }
        // Switching the screens has always been open to every signed-in staff member.
        permissions.put(AdminModule.SCREENS, AccessLevel.EDIT);
        if (role == AdminRole.EDITOR) {
            permissions.put(AdminModule.SCREEN_POSTERS, AccessLevel.EDIT);
        }
        return permissions;
    }

    /** Replace the user's permissions with those of the role, keeping both in step. */
    public static void applyTo(AdminUser user, AdminRole role) {
        user.getPermissions().clear();
        user.getPermissions().putAll(forRole(role));
    }
}
