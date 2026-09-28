package cafe.community.backend.config;

import cafe.community.backend.aurora.FakeAuroraClient;
import cafe.community.backend.controller.TestSupportController;
import cafe.community.backend.filter.RateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Profiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the beans that must only exist in the e2e stack: header login ({@code X-Test-Oid}), the
 * database reset and seed endpoints, and the fake Aurora client. They are kept out of production by
 * their {@code @Profile} alone, so removing or widening one would let production accept a login by
 * header or expose a reset endpoint. Likewise the real security config and the rate limiter must
 * stay out of e2e (and the limiter out of unit tests).
 *
 * <p>Checks both the literal annotation (like the-harry-list's guard) and what the expression
 * actually matches, so a change such as {@code @Profile("e2e | prod")} fails too.
 */
class E2eProfileGuardTest {

    private static final Set<String> PRODUCTION = Set.of("prod");
    private static final Set<String> DEV = Set.of();          // no profile: the default dev setup
    private static final Set<String> UNIT_TESTS = Set.of("test");
    private static final Set<String> E2E = Set.of("e2e");

    @Test
    void e2eOnlyBeansAreGatedToTheE2eProfile() {
        for (Class<?> type : new Class<?>[]{E2eSecurityConfig.class, TestSupportController.class,
                FakeAuroraClient.class}) {
            assertThat(profileOf(type)).as(type.getSimpleName()).containsExactly("e2e");
            assertThat(activeIn(type, E2E)).as(type.getSimpleName() + " in e2e").isTrue();
            for (Set<String> other : Set.of(PRODUCTION, DEV, UNIT_TESTS)) {
                assertThat(activeIn(type, other)).as(type.getSimpleName() + " with profiles " + other).isFalse();
            }
        }
    }

    @Test
    void productionSecurityIsActiveEverywhereExceptE2e() {
        assertThat(profileOf(SecurityConfig.class)).containsExactly("!e2e");
        assertThat(activeIn(SecurityConfig.class, PRODUCTION)).isTrue();
        assertThat(activeIn(SecurityConfig.class, DEV)).isTrue();
        assertThat(activeIn(SecurityConfig.class, UNIT_TESTS)).isTrue();
        assertThat(activeIn(SecurityConfig.class, E2E)).isFalse();
    }

    @Test
    void rateLimiterIsActiveInProductionAndDevOnly() {
        assertThat(profileOf(RateLimitFilter.class)).containsExactly("!test & !e2e");
        assertThat(activeIn(RateLimitFilter.class, PRODUCTION)).isTrue();
        assertThat(activeIn(RateLimitFilter.class, DEV)).isTrue();
        assertThat(activeIn(RateLimitFilter.class, UNIT_TESTS)).isFalse();
        assertThat(activeIn(RateLimitFilter.class, E2E)).isFalse();
    }

    private static String[] profileOf(Class<?> type) {
        Profile profile = type.getAnnotation(Profile.class);
        assertThat(profile).as(type.getSimpleName() + " must be annotated with @Profile").isNotNull();
        return profile.value();
    }

    /** Evaluates the bean's @Profile expression the way Spring does for the given active profiles. */
    private static boolean activeIn(Class<?> type, Set<String> activeProfiles) {
        Set<String> effective = activeProfiles.isEmpty() ? Set.of("default") : activeProfiles;
        return Profiles.of(profileOf(type)).matches(effective::contains);
    }
}
