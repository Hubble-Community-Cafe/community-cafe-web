package cafe.community.backend.model;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/** The presets must reproduce exactly the access the old hierarchical roles gave. */
class AccessPresetsTest {

    private static final AdminModule[] CONTENT = {
            AdminModule.MENU, AdminModule.DAILY_DISH, AdminModule.OPENING_HOURS, AdminModule.EVENTS,
            AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS, AdminModule.MEDIA,
    };

    @Test
    void viewerSeesAllContentAndSwitchesScreens() {
        var viewer = AccessPresets.forRole(AdminRole.VIEWER);

        assertThat(Arrays.stream(CONTENT).map(viewer::get)).containsOnly(AccessLevel.VIEW);
        assertThat(viewer.get(AdminModule.SCREENS)).isEqualTo(AccessLevel.EDIT);
        assertThat(viewer).doesNotContainKey(AdminModule.SCREEN_POSTERS);
    }

    @Test
    void dddPosterIsAViewerWhoEditsTheDailyDish() {
        var poster = AccessPresets.forRole(AdminRole.DDD_POSTER);

        assertThat(poster.get(AdminModule.DAILY_DISH)).isEqualTo(AccessLevel.EDIT);
        assertThat(poster.get(AdminModule.MENU)).isEqualTo(AccessLevel.VIEW);
        assertThat(poster).doesNotContainKey(AdminModule.SCREEN_POSTERS);
    }

    @Test
    void editorEditsEverything() {
        assertThat(AccessPresets.forRole(AdminRole.EDITOR))
                .containsOnlyKeys(AdminModule.values())
                .allSatisfy((module, level) -> assertThat(level).isEqualTo(AccessLevel.EDIT));
    }

    @Test
    void adminStoresNothingBecauseTheRoleGrantsEverything() {
        assertThat(AccessPresets.forRole(AdminRole.ADMIN)).isEmpty();
    }

    @Test
    void editIncludesViewButNotTheOtherWayRound() {
        assertThat(AccessLevel.EDIT.includes(AccessLevel.VIEW)).isTrue();
        assertThat(AccessLevel.VIEW.includes(AccessLevel.EDIT)).isFalse();
        assertThat(AccessLevel.HIDDEN.includes(AccessLevel.VIEW)).isFalse();
    }
}
