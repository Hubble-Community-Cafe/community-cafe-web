package cafe.community.backend.controller;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.repository.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * E2E-only support endpoints, mounted under {@code /test} and active <strong>only</strong>
 * in the {@code e2e} Spring profile (see {@link cafe.community.backend.config.E2eSecurityConfig},
 * which permits {@code /test/**}). They let the Playwright suite reset to a known baseline and
 * seed users with a given role; all content is then created through the real admin APIs via the
 * {@code X-Test-Oid} header bridge. Never loaded in dev or prod.
 */
@Profile("e2e")
@RestController
@RequestMapping("/test")
public class TestSupportController {

    private final MenuItemRepository menuItems;
    private final MenuCategoryRepository menuCategories;
    private final DailyDishRepository dailyDishes;
    private final BoardMemberRepository boardMembers;
    private final BoardTermRepository boardTerms;
    private final EventRepository events;
    private final VacancyRepository vacancies;
    private final AssociationRepository associations;
    private final OpeningHoursRepository openingHours;
    private final HoursOverrideRepository hoursOverrides;
    private final MediaAssetRepository mediaAssets;
    private final AuditLogRepository auditLogs;
    private final AdminUserRepository adminUsers;

    public TestSupportController(
            MenuItemRepository menuItems, MenuCategoryRepository menuCategories,
            DailyDishRepository dailyDishes, BoardMemberRepository boardMembers,
            BoardTermRepository boardTerms, EventRepository events, VacancyRepository vacancies,
            AssociationRepository associations, OpeningHoursRepository openingHours,
            HoursOverrideRepository hoursOverrides, MediaAssetRepository mediaAssets,
            AuditLogRepository auditLogs, AdminUserRepository adminUsers) {
        this.menuItems = menuItems;
        this.menuCategories = menuCategories;
        this.dailyDishes = dailyDishes;
        this.boardMembers = boardMembers;
        this.boardTerms = boardTerms;
        this.events = events;
        this.vacancies = vacancies;
        this.associations = associations;
        this.openingHours = openingHours;
        this.hoursOverrides = hoursOverrides;
        this.mediaAssets = mediaAssets;
        this.auditLogs = auditLogs;
        this.adminUsers = adminUsers;
    }

    /** Wipe all mutable state to a clean baseline. FK-safe order: children, then media, then users. */
    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void reset() {
        // Content that references media assets first.
        menuItems.deleteAllInBatch();
        // menu_category self-references via parent_id, so drop sub-categories first.
        menuCategories.deleteSubcategories();
        menuCategories.deleteAllInBatch();
        dailyDishes.deleteAllInBatch();
        boardMembers.deleteAllInBatch();
        boardTerms.deleteAllInBatch();
        events.deleteAllInBatch();
        vacancies.deleteAllInBatch();
        associations.deleteAllInBatch();
        openingHours.deleteAllInBatch();
        hoursOverrides.deleteAllInBatch();
        // Then the media assets they pointed at.
        mediaAssets.deleteAllInBatch();
        // Audit trail and users last.
        auditLogs.deleteAllInBatch();
        adminUsers.deleteAllInBatch();
    }

    /** Create or update an admin user with a fixed role, for RBAC scenarios. */
    @PostMapping("/users")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void seedUser(@RequestBody SeedUserRequest req) {
        AdminUser user = adminUsers.findByAzureOid(req.oid()).orElseGet(AdminUser::new);
        user.setAzureOid(req.oid());
        user.setEmail(req.email() != null && !req.email().isBlank() ? req.email() : req.oid() + "@e2e.test");
        user.setDisplayName(req.name() != null && !req.name().isBlank() ? req.name() : req.oid());
        user.setRole(AdminRole.valueOf(req.role()));
        adminUsers.save(user);
    }

    public record SeedUserRequest(@NotBlank String oid, String email, String name, @NotBlank String role) {}
}
