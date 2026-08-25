package cafe.community.backend.service;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.ScreenSceneSettings;
import cafe.community.backend.repository.ScreenSceneSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Reads and writes the single row mapping each screen scene to an Aurora static poster.
 * The row is created on first read, so there is nothing to seed.
 */
@Service
public class ScreenSceneSettingsService {

    private final ScreenSceneSettingsRepository repository;
    private final AuditService auditService;

    public ScreenSceneSettingsService(ScreenSceneSettingsRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    /** The current mapping, creating the row with both posters unset if it does not exist yet. */
    @Transactional
    public ScreenSceneSettings get() {
        return repository.findById(ScreenSceneSettings.SINGLETON_ID)
                .orElseGet(() -> repository.save(new ScreenSceneSettings()));
    }

    /**
     * Point the closed and last-call scenes at the given Aurora poster ids. Either may be null to
     * leave that scene unconfigured.
     */
    @Transactional
    public ScreenSceneSettings update(Long closedPosterId, Long lastCallPosterId) {
        ScreenSceneSettings settings = get();

        List<FieldChange> changes = new ArrayList<>();
        if (!Objects.equals(settings.getClosedPosterId(), closedPosterId)) {
            changes.add(new FieldChange("Closed poster",
                    str(settings.getClosedPosterId()), str(closedPosterId)));
        }
        if (!Objects.equals(settings.getLastCallPosterId(), lastCallPosterId)) {
            changes.add(new FieldChange("Last call poster",
                    str(settings.getLastCallPosterId()), str(lastCallPosterId)));
        }

        settings.setClosedPosterId(closedPosterId);
        settings.setLastCallPosterId(lastCallPosterId);
        ScreenSceneSettings saved = repository.save(settings);

        auditService.recordUpdate(AuditEntityType.SCREEN_SCENE, saved.getId(), "Screen scene posters",
                changes, "Updated the posters shown for the closed and last call scenes");

        return saved;
    }

    private static String str(Long value) {
        return value == null ? "" : value.toString();
    }
}
