package cafe.community.backend.service;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraClient;
import cafe.community.backend.aurora.AuroraException;
import cafe.community.backend.dto.ScreenSceneStatusDto;
import cafe.community.backend.model.ScreenScene;
import cafe.community.backend.model.ScreenSceneSettings;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The scene logic itself, against a mocked Aurora. The ordering test is the important one:
 * handlers must move before the poster is shown, or screens joining the static handler never
 * receive the update event.
 */
class ScreenSceneServiceTest {

    private static final String CAROUSEL = "CarouselPosterHandler";
    private static final String STATIC = "StaticPosterHandler";

    private AuroraClient aurora;
    private ScreenSceneSettingsService settingsService;
    private ScreenSceneService service;
    private ScreenSceneSettings settings;

    @BeforeEach
    void setUp() {
        aurora = mock(AuroraClient.class);
        settingsService = mock(ScreenSceneSettingsService.class);
        AuditService auditService = mock(AuditService.class);

        settings = new ScreenSceneSettings();
        settings.setClosedPosterId(3L);
        settings.setLastCallPosterId(4L);
        when(settingsService.get()).thenReturn(settings);
        when(aurora.isEnabled()).thenReturn(true);

        service = new ScreenSceneService(aurora, settingsService, auditService,
                CAROUSEL, STATIC, "https://aurora-client.test");
    }

    private void givenScreens(long... ids) {
        List<Aurora.Screen> screens = java.util.Arrays.stream(ids)
                .mapToObj(id -> new Aurora.Screen(id, "Screen " + id))
                .toList();
        when(aurora.getScreens()).thenReturn(screens);
    }

    @Test
    void open_movesEveryScreenToCarouselAndShowsNoPoster() {
        givenScreens(1, 2, 3);

        service.apply(ScreenScene.OPEN);

        verify(aurora).setScreenHandler(1, CAROUSEL);
        verify(aurora).setScreenHandler(2, CAROUSEL);
        verify(aurora).setScreenHandler(3, CAROUSEL);
        verify(aurora, never()).showStaticPoster(anyLong());
    }

    @Test
    void closed_movesHandlersBeforeShowingThePoster() {
        givenScreens(1, 2);

        service.apply(ScreenScene.CLOSED);

        InOrder order = inOrder(aurora);
        order.verify(aurora).setScreenHandler(1, STATIC);
        order.verify(aurora).setScreenHandler(2, STATIC);
        order.verify(aurora).showStaticPoster(3L);
    }

    @Test
    void lastCall_usesItsOwnPoster() {
        givenScreens(1);

        service.apply(ScreenScene.LAST_CALL);

        verify(aurora).setScreenHandler(1, STATIC);
        verify(aurora).showStaticPoster(4L);
    }

    @Test
    void sceneWithoutConfiguredPoster_failsBeforeTouchingAnyScreen() {
        settings.setClosedPosterId(null);
        givenScreens(1, 2);

        assertThatThrownBy(() -> service.apply(ScreenScene.CLOSED))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No poster is configured");

        verify(aurora, never()).setScreenHandler(anyLong(), anyString());
        verify(aurora, never()).showStaticPoster(anyLong());
    }

    @Test
    void noScreens_failsClearly() {
        givenScreens();

        assertThatThrownBy(() -> service.apply(ScreenScene.OPEN))
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("no screens");
    }

    @Test
    void failingScreen_reportsWhichOneAndSkipsThePoster() {
        givenScreens(1, 2);
        doThrow(new AuroraException("Aurora returned 400")).when(aurora).setScreenHandler(2, STATIC);

        assertThatThrownBy(() -> service.apply(ScreenScene.CLOSED))
                .isInstanceOf(AuroraException.class)
                .hasMessageContaining("Screen 2")
                .hasMessageContaining("400");

        verify(aurora, never()).showStaticPoster(anyLong());
    }

    @Test
    void status_reportsOpenWhenEveryScreenIsOnCarousel() {
        when(aurora.getScreenHandlers()).thenReturn(List.of(
                new Aurora.ScreenHandler("u1", CAROUSEL, List.of(
                        new Aurora.Screen(1, "Hubble"), new Aurora.Screen(2, "Plaza"))),
                new Aurora.ScreenHandler("u2", STATIC, List.of())));
        when(aurora.getStaticPosterState()).thenReturn(new Aurora.StaticPosterState(null, true));
        when(aurora.getStaticPosters()).thenReturn(List.of());

        ScreenSceneStatusDto status = service.status();

        assertThat(status.available()).isTrue();
        assertThat(status.currentScene()).isEqualTo("OPEN");
        assertThat(status.screens()).extracting(ScreenSceneStatusDto.Screen::name)
                .containsExactly("Hubble", "Plaza");
    }

    @Test
    void status_reportsClosedWhenStaticHandlerShowsTheClosedPoster() {
        when(aurora.getScreenHandlers()).thenReturn(List.of(
                new Aurora.ScreenHandler("u1", STATIC, List.of(new Aurora.Screen(1, "Hubble")))));
        when(aurora.getStaticPosterState()).thenReturn(new Aurora.StaticPosterState(
                new Aurora.Poster(3, null, null, null, null), true));
        when(aurora.getStaticPosters()).thenReturn(List.of());

        assertThat(service.status().currentScene()).isEqualTo("CLOSED");
    }

    @Test
    void status_reportsMixedWhenScreensDisagree() {
        when(aurora.getScreenHandlers()).thenReturn(List.of(
                new Aurora.ScreenHandler("u1", CAROUSEL, List.of(new Aurora.Screen(1, "Hubble"))),
                new Aurora.ScreenHandler("u2", STATIC, List.of(new Aurora.Screen(2, "Plaza")))));
        when(aurora.getStaticPosterState()).thenReturn(new Aurora.StaticPosterState(null, true));
        when(aurora.getStaticPosters()).thenReturn(List.of());

        assertThat(service.status().currentScene()).isEqualTo("MIXED");
    }

    @Test
    void status_buildsPosterThumbnailUrlFromTheClientHost() {
        when(aurora.getScreenHandlers()).thenReturn(List.of());
        when(aurora.getStaticPosterState()).thenReturn(new Aurora.StaticPosterState(null, true));
        when(aurora.getStaticPosters()).thenReturn(List.of(
                new Aurora.Poster(3, null, null,
                        new Aurora.PosterFile("/static/local-posters/abc.png", "Closed slide.png"), null),
                new Aurora.Poster(9, null, null, null, null)));

        assertThat(service.status().posters()).containsExactly(
                new ScreenSceneStatusDto.Poster(3, "Closed slide.png",
                        "https://aurora-client.test/static/local-posters/abc.png"),
                new ScreenSceneStatusDto.Poster(9, "Poster 9", null));
    }

    @Test
    void status_isUnavailableWhenAuroraIsOff() {
        when(aurora.isEnabled()).thenReturn(false);

        ScreenSceneStatusDto status = service.status();

        assertThat(status.available()).isFalse();
        assertThat(status.unavailableReason()).contains("not configured");
    }

    @Test
    void status_isUnavailableWhenAuroraCannotBeReached() {
        when(aurora.getScreenHandlers()).thenThrow(new AuroraException("Could not reach Aurora"));

        ScreenSceneStatusDto status = service.status();

        assertThat(status.available()).isFalse();
        assertThat(status.unavailableReason()).contains("Could not reach Aurora");
    }
}
