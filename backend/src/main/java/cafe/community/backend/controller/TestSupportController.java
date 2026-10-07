package cafe.community.backend.controller;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.FakeAuroraClient;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.model.ScreenSceneSettings;
import cafe.community.backend.repository.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    private final FormSubmissionRepository formSubmissions;
    private final ScreenSceneSettingsRepository screenSceneSettings;
    private final FakeAuroraClient fakeAurora;

    public TestSupportController(
            MenuItemRepository menuItems, MenuCategoryRepository menuCategories,
            DailyDishRepository dailyDishes, BoardMemberRepository boardMembers,
            BoardTermRepository boardTerms, EventRepository events, VacancyRepository vacancies,
            AssociationRepository associations, OpeningHoursRepository openingHours,
            HoursOverrideRepository hoursOverrides, MediaAssetRepository mediaAssets,
            AuditLogRepository auditLogs, AdminUserRepository adminUsers,
            FormSubmissionRepository formSubmissions,
            ScreenSceneSettingsRepository screenSceneSettings, FakeAuroraClient fakeAurora) {
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
        this.formSubmissions = formSubmissions;
        this.screenSceneSettings = screenSceneSettings;
        this.fakeAurora = fakeAurora;
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
        formSubmissions.deleteAllInBatch();
        // Then the media assets they pointed at.
        mediaAssets.deleteAllInBatch();
        // Audit trail and users last.
        auditLogs.deleteAllInBatch();
        adminUsers.deleteAllInBatch();

        // Screen scenes: reset both sides, the poster mapping and the fake Aurora's own state,
        // so specs cannot leak a handler assignment or a poster choice into each other.
        // Seeded with the same ids the production migration uses.
        screenSceneSettings.deleteAllInBatch();
        ScreenSceneSettings settings = new ScreenSceneSettings();
        settings.setClosedPosterId(3L);
        settings.setLastCallPosterId(4L);
        screenSceneSettings.save(settings);
        fakeAurora.reset();
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

    /** The poster requests the fake Aurora accepted, without the file bytes. */
    @GetMapping("/aurora/poster-requests")
    public List<PosterRequestView> posterRequests() {
        return fakeAurora.posterRequests().stream().map(PosterRequestView::of).toList();
    }

    /** Make the fake Aurora accept, be down, or reject the file for the next poster requests. */
    @PutMapping("/aurora/poster-requests/mode")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void posterRequestMode(@RequestBody PosterRequestModeRequest req) {
        fakeAurora.setPosterRequestMode(req.mode());
    }

    public record PosterRequestModeRequest(FakeAuroraClient.PosterRequestMode mode) {}

    public record PosterRequestView(
            String requesterName, String requesterEmail, String requesterAssociation, String message,
            String name, String label, String startDate, String expirationDate, String accentColor,
            Integer defaultTimeout, String fileName, String contentType, int fileSize) {

        static PosterRequestView of(Aurora.PosterRequest r) {
            return new PosterRequestView(r.requesterName(), r.requesterEmail(), r.requesterAssociation(),
                    r.message(), r.name(), r.label(),
                    r.startDate() == null ? null : r.startDate().toString(),
                    r.expirationDate() == null ? null : r.expirationDate().toString(),
                    r.accentColor(), r.defaultTimeout(),
                    r.file().filename(), r.file().contentType(), r.file().data().length);
        }
    }

    public record SeedUserRequest(@NotBlank String oid, String email, String name, @NotBlank String role) {}
}
