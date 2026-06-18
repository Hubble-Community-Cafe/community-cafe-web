package cafe.community.backend.model;

/**
 * The type of entity an {@link AuditLog} entry refers to. Grows as CMS modules
 * (menu, hours, events, board, vacancies) are added.
 */
public enum AuditEntityType {
    ADMIN_USER,
    MEDIA_ASSET,
    MENU_CATEGORY,
    MENU_ITEM,
    DAILY_DISH,
    OPENING_HOURS,
    HOURS_OVERRIDE
}
