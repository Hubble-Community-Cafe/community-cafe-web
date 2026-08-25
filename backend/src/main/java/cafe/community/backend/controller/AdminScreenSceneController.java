package cafe.community.backend.controller;

import cafe.community.backend.dto.ScreenSceneSettingsRequest;
import cafe.community.backend.dto.ScreenSceneStatusDto;
import cafe.community.backend.model.ScreenScene;
import cafe.community.backend.service.ScreenSceneService;
import cafe.community.backend.service.ScreenSceneSettingsService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * The Aurora screen scene panel.
 *
 * <p>Switching the scene is a bar-shift action, so any signed-in staff member may do it;
 * {@code /api/admin/**} already requires a valid staff token. Choosing which poster a scene shows
 * is setup, so that stays with editors.
 */
@RestController
@RequestMapping("/api/admin/screens")
public class AdminScreenSceneController {

    private final ScreenSceneService sceneService;
    private final ScreenSceneSettingsService settingsService;

    public AdminScreenSceneController(ScreenSceneService sceneService,
                                      ScreenSceneSettingsService settingsService) {
        this.sceneService = sceneService;
        this.settingsService = settingsService;
    }

    /** Live screen state, the derived scene, and the posters available to pick from. */
    @GetMapping("/scene")
    public ScreenSceneStatusDto status() {
        return sceneService.status();
    }

    /** Put every screen into the given scene. */
    @PostMapping("/scene/{scene}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void apply(@PathVariable ScreenScene scene) {
        sceneService.apply(scene);
    }

    /** Point the closed and last-call scenes at Aurora posters. */
    @PutMapping("/settings")
    @PreAuthorize("hasRole('EDITOR')")
    public ScreenSceneStatusDto updateSettings(@RequestBody ScreenSceneSettingsRequest req) {
        settingsService.update(req.closedPosterId(), req.lastCallPosterId());
        return sceneService.status();
    }
}
