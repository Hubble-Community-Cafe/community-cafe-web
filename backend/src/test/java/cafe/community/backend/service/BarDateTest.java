package cafe.community.backend.service;

import cafe.community.backend.dto.DailyDishDto;
import cafe.community.backend.dto.DailyDishRequest;
import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.BarLocation;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * "Today" is a date in Eindhoven, not wherever the server is: just after midnight there, it is
 * still the evening before in UTC. Today's dish read the server's own date before the shared clock.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BarDateTest {

    /** 23:30 UTC on 10 January is already 00:30 on the 11th in Eindhoven. */
    private static final Instant JUST_AFTER_MIDNIGHT_IN_EINDHOVEN = Instant.parse("2030-01-10T23:30:00Z");

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(JUST_AFTER_MIDNIGHT_IN_EINDHOVEN, ZoneId.of("Europe/Amsterdam"));
        }
    }

    @Autowired MenuService menu;
    @Autowired EventService events;

    @Test
    void todaysDishIsTheDishForTheBarsDate() {
        menu.createDish(new DailyDishRequest(LocalDate.of(2030, 1, 10), "Yesterday's soup", null, null, null));
        menu.createDish(new DailyDishRequest(LocalDate.of(2030, 1, 11), "Pasta pesto", null, null, null));

        assertThat(menu.getTodaysDishes()).extracting(DailyDishDto::name).containsExactly("Pasta pesto");
    }

    @Test
    void upcomingEventsStartFromTheBarsDate() {
        events.create(new EventRequest("HUBBLE", "Last night's quiz", null, LocalDate.of(2030, 1, 10), null, null, null, null, true));
        events.create(new EventRequest("HUBBLE", "Tonight's quiz", null, LocalDate.of(2030, 1, 11), null, null, null, null, true));

        assertThat(events.getUpcoming(BarLocation.HUBBLE)).extracting(EventDto::title).containsExactly("Tonight's quiz");
    }
}
