package cafe.community.backend.model;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/** The presets must reproduce exactly the access the old hierarchical roles gave. */
class AccessPresetTest {

    private static final AdminModule[] CONTENT = {
            AdminModule.MENU, AdminModule.DAILY_DISH, AdminModule.OPENING_HOURS, AdminModule.EVENTS,
            AdminModule.BOARD, AdminModule.VACANCIES, AdminModule.ASSOCIATIONS, AdminModule.MEDIA,
    };

    @Test
    void viewerSeesAllContentAndSwitchesScreens() {
        var viewer = AccessPreset.VIEWER.permissions();

        assertThat(Arrays.stream(CONTENT).map(viewer::get)).containsOnly(AccessLevel.VIEW);
        assertThat(viewer.get(AdminModule.SCREENS)).isEqualTo(AccessLevel.EDIT);
        assertThat(viewer).doesNotContainKey(AdminModule.SCREEN_POSTERS);
    }

    @Test
    void dddPosterIsAViewerWhoEditsTheDailyDish() {
        var poster = AccessPreset.DDD_POSTER.permissions();

        assertThat(poster.get(AdminModule.DAILY_DISH)).isEqualTo(AccessLevel.EDIT);
        assertThat(poster.get(AdminModule.MENU)).isEqualTo(AccessLevel.VIEW);
        assertThat(poster).doesNotContainKey(AdminModule.SCREEN_POSTERS);
    }

    @Test
    void editorEditsEverything() {
        assertThat(AccessPreset.EDITOR.permissions())
                .containsOnlyKeys(AdminModule.values())
                .allSatisfy((module, level) -> assertThat(level).isEqualTo(AccessLevel.EDIT));
    }

    @Test
    void applyingAPresetMakesAStaffMemberWithExactlyItsAccess() {
        AdminUser user = new AdminUser();
        user.setRole(AdminRole.ADMIN);
        user.getPermissions().put(AdminModule.MEDIA, AccessLevel.EDIT);

        AccessPreset.VIEWER.applyTo(user);

        assertThat(user.getRole()).isEqualTo(AdminRole.STAFF);
        assertThat(user.getPermissions()).isEqualTo(AccessPreset.VIEWER.permissions());
    }

    @Test
    void editIncludesViewButNotTheOtherWayRound() {
        assertThat(AccessLevel.EDIT.includes(AccessLevel.VIEW)).isTrue();
        assertThat(AccessLevel.VIEW.includes(AccessLevel.EDIT)).isFalse();
        assertThat(AccessLevel.HIDDEN.includes(AccessLevel.VIEW)).isFalse();
    }
}
