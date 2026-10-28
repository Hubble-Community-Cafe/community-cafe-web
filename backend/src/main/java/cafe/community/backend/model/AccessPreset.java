package cafe.community.backend.model;

import java.util.EnumMap;
import java.util.Map;

/**
 * One-click starting points for a staff member's access, named after the hierarchical roles the
 * admin used to have and giving exactly their access. Must stay identical to the backfill in
 * {@code V4__admin_user_permission.sql} and to {@code preset()} in the admin's {@code lib/access.ts}.
 */
public enum AccessPreset {
    /** Look at every content tab and switch the screens. */
    VIEWER,
    /** A viewer who can also post the daily dish. */
    DDD_POSTER,
    /** Edit every tab, including the screen posters; no users or audit log. */
    EDITOR;

    private static final AdminModule[] CONTENT = {
            AdminModule.MENU, AdminModule.DAILY_DISH, AdminModule.OPENING_HOURS, AdminModule.EVENTS,
            AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS, AdminModule.MEDIA,
    };

    public Map<AdminModule, AccessLevel> permissions() {
        Map<AdminModule, AccessLevel> permissions = new EnumMap<>(AdminModule.class);
        AccessLevel content = this == EDITOR ? AccessLevel.EDIT : AccessLevel.VIEW;
        for (AdminModule module : CONTENT) {
            permissions.put(module, content);
        }
        if (this == DDD_POSTER) {
            permissions.put(AdminModule.DAILY_DISH, AccessLevel.EDIT);
        }
        permissions.put(AdminModule.SCREENS, AccessLevel.EDIT);
        if (this == EDITOR) {
            permissions.put(AdminModule.SCREEN_POSTERS, AccessLevel.EDIT);
        }
        return permissions;
    }

    /** Make the user a staff member with exactly this preset's access. */
    public void applyTo(AdminUser user) {
        user.setRole(AdminRole.STAFF);
        user.getPermissions().clear();
        user.getPermissions().putAll(permissions());
    }
}
