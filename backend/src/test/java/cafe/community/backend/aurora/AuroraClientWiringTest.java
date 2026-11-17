package cafe.community.backend.aurora;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Outside the e2e profile the website talks to the real Aurora, and only to it: the in-memory
 * fake is no longer a subclass that @Primary had to push to the front.
 */
@SpringBootTest
@ActiveProfiles("test")
class AuroraClientWiringTest {

    @Autowired ApplicationContext context;

    @Test
    void usesTheRealClientOutsideTheE2eProfile() {
        assertThat(context.getBeansOfType(AuroraClient.class).values())
                .singleElement().isInstanceOf(HttpAuroraClient.class);
    }

    /** The fake gets getScreens from the interface, the same code the real client uses. */
    @Test
    void theFakeListsItsScreensThroughTheSharedDefault() {
        assertThat(new FakeAuroraClient().getScreens()).extracting(Aurora.Screen::name)
                .containsExactly("HubbleGeneralScreen", "PlazaScreen", "FoyerScreen");
    }
}
