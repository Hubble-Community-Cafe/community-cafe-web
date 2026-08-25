package cafe.community.backend.service;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraClient;
import cafe.community.backend.aurora.AuroraException;
import cafe.community.backend.dto.ScreenSceneStatusDto;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.ScreenScene;
import cafe.community.backend.model.ScreenSceneSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Puts the Aurora screens into one of the three scenes the bar cares about.
 *
 * <p>Handlers first, then the poster. Aurora's static poster handler only pushes
 * {@code update_static_poster} to screens already attached to it, and attaching a screen pushes
 * it no state, so moving the screens first is what guarantees every screen sees the new poster.
 * This is also the order star-wind uses in production against the same instance.
 */
@Service
public class ScreenSceneService {

    private static final Logger log = LoggerFactory.getLogger(ScreenSceneService.class);

    private static final String MIXED = "MIXED";
    private static final String UNKNOWN = "UNKNOWN";

    private final AuroraClient aurora;
    private final ScreenSceneSettingsService settingsService;
    private final AuditService auditService;
    private final String carouselHandler;
    private final String staticPosterHandler;
    private final String posterBaseUrl;

    public ScreenSceneService(
            AuroraClient aurora,
            ScreenSceneSettingsService settingsService,
            AuditService auditService,
            @Value("${app.aurora.handler.carousel:CarouselPosterHandler}") String carouselHandler,
            @Value("${app.aurora.handler.static-poster:StaticPosterHandler}") String staticPosterHandler,
            @Value("${app.aurora.poster-base-url:}") String posterBaseUrl) {
        this.aurora = aurora;
        this.settingsService = settingsService;
        this.auditService = auditService;
        this.carouselHandler = carouselHandler;
        this.staticPosterHandler = staticPosterHandler;
        this.posterBaseUrl = stripTrailingSlash(posterBaseUrl);
    }

    /**
     * Move every screen Aurora knows about into the given scene.
     *
     * <p>Aurora has no transaction across screens. If a screen fails to switch we stop and
     * surface which one, leaving the earlier screens already switched; that is visible on the
     * wall and in the status readout, and pressing the button again is safe.
     */
    public void apply(ScreenScene scene) {
        Long posterId = null;
        if (scene.requiresPoster()) {
            posterId = settingsService.get().posterIdFor(scene);
            if (posterId == null) {
                throw new IllegalArgumentException(
                        "No poster is configured for the " + scene.getDisplayName() + " scene.");
            }
        }

        String handler = handlerFor(scene);
        List<Aurora.Screen> screens = aurora.getScreens();
        if (screens.isEmpty()) {
            throw new AuroraException("Aurora reports no screens to switch.");
        }

        for (Aurora.Screen screen : screens) {
            try {
                aurora.setScreenHandler(screen.id(), handler);
            } catch (AuroraException e) {
                throw new AuroraException("Could not switch screen \"" + screen.name()
                        + "\" to " + handler + ": " + e.getMessage(), e);
            }
        }

        if (posterId != null) {
            aurora.showStaticPoster(posterId);
        }

        log.info("Applied screen scene {} to {} screens using {}", scene, screens.size(), handler);
        auditService.recordAction(AuditEntityType.SCREEN_SCENE, null, scene.getDisplayName(),
                AuditAction.SCENE_CHANGED, List.of(),
                "Set " + screens.size() + " screens to the " + scene.getDisplayName() + " scene");
    }

    /** Live view of the screens plus the posters available to pick from. Never throws. */
    public ScreenSceneStatusDto status() {
        if (!aurora.isEnabled()) {
            return ScreenSceneStatusDto.unavailable("Aurora is not configured.");
        }
        try {
            List<ScreenSceneStatusDto.Screen> screens = new ArrayList<>();
            for (Aurora.ScreenHandler handler : aurora.getScreenHandlers()) {
                if (handler.entities() == null) {
                    continue;
                }
                for (Aurora.Screen screen : handler.entities()) {
                    screens.add(new ScreenSceneStatusDto.Screen(screen.id(), screen.name(), handler.name()));
                }
            }
            screens.sort(Comparator.comparingLong(ScreenSceneStatusDto.Screen::id));

            ScreenSceneSettings settings = settingsService.get();
            Aurora.StaticPosterState state = aurora.getStaticPosterState();
            Long activePosterId = state.activePoster() == null ? null : state.activePoster().id();

            return new ScreenSceneStatusDto(
                    true,
                    null,
                    deriveScene(screens, activePosterId, settings),
                    activePosterId,
                    settings.getClosedPosterId(),
                    settings.getLastCallPosterId(),
                    screens,
                    posterOptions());
        } catch (AuroraException e) {
            log.warn("Could not read Aurora status", e);
            return ScreenSceneStatusDto.unavailable(e.getMessage());
        }
    }

    private List<ScreenSceneStatusDto.Poster> posterOptions() {
        List<ScreenSceneStatusDto.Poster> options = new ArrayList<>();
        for (Aurora.Poster poster : aurora.getStaticPosters()) {
            options.add(new ScreenSceneStatusDto.Poster(poster.id(), poster.label(), imageUrl(poster)));
        }
        return options;
    }

    /**
     * Poster images are served publicly by the Aurora client host, not the API host, so the
     * thumbnail URL is built from a separate base. Null when that base is not configured.
     */
    private String imageUrl(Aurora.Poster poster) {
        String path = poster.imagePath();
        if (posterBaseUrl.isBlank() || path == null || path.isBlank()) {
            return null;
        }
        return posterBaseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    /** Which scene the current handler assignment adds up to, or MIXED when they disagree. */
    private String deriveScene(List<ScreenSceneStatusDto.Screen> screens, Long activePosterId,
                               ScreenSceneSettings settings) {
        if (screens.isEmpty()) {
            return UNKNOWN;
        }
        if (screens.stream().allMatch(s -> carouselHandler.equals(s.handler()))) {
            return ScreenScene.OPEN.name();
        }
        if (screens.stream().allMatch(s -> staticPosterHandler.equals(s.handler()))) {
            if (activePosterId != null && Objects.equals(activePosterId, settings.getClosedPosterId())) {
                return ScreenScene.CLOSED.name();
            }
            if (activePosterId != null && Objects.equals(activePosterId, settings.getLastCallPosterId())) {
                return ScreenScene.LAST_CALL.name();
            }
        }
        return MIXED;
    }

    private String handlerFor(ScreenScene scene) {
        return scene == ScreenScene.OPEN ? carouselHandler : staticPosterHandler;
    }

    private static String stripTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
