package cafe.community.backend.service;

import cafe.community.backend.model.ScreenScene;
import cafe.community.backend.model.ScreenSceneSettings;
import cafe.community.backend.repository.ScreenSceneSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ScreenSceneSettingsServiceTest {

    @Autowired ScreenSceneSettingsService service;
    @Autowired ScreenSceneSettingsRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    @Test
    void get_createsTheRowUnconfigured() {
        ScreenSceneSettings settings = service.get();

        assertThat(settings.getId()).isEqualTo(ScreenSceneSettings.SINGLETON_ID);
        assertThat(settings.getClosedPosterId()).isNull();
        assertThat(settings.getLastCallPosterId()).isNull();
    }

    @Test
    void get_isStableAcrossCalls() {
        service.get();
        service.get();

        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    void update_setsBothPosters() {
        service.update(3L, 4L);

        ScreenSceneSettings settings = service.get();
        assertThat(settings.getClosedPosterId()).isEqualTo(3L);
        assertThat(settings.getLastCallPosterId()).isEqualTo(4L);
        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    void update_clearsWithNull() {
        service.update(3L, 4L);
        service.update(null, 4L);

        assertThat(service.get().getClosedPosterId()).isNull();
        assertThat(service.get().getLastCallPosterId()).isEqualTo(4L);
    }

    @Test
    void posterIdFor_mapsScenesToTheirPoster() {
        service.update(3L, 4L);
        ScreenSceneSettings settings = service.get();

        assertThat(settings.posterIdFor(ScreenScene.CLOSED)).isEqualTo(3L);
        assertThat(settings.posterIdFor(ScreenScene.LAST_CALL)).isEqualTo(4L);
        assertThat(settings.posterIdFor(ScreenScene.OPEN)).isNull();
    }

    @Test
    void scenes_declareWhetherTheyNeedAPoster() {
        assertThat(ScreenScene.OPEN.requiresPoster()).isFalse();
        assertThat(ScreenScene.CLOSED.requiresPoster()).isTrue();
        assertThat(ScreenScene.LAST_CALL.requiresPoster()).isTrue();
    }
}
