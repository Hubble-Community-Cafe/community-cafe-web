package cafe.community.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * The one clock the backend reads the time from, in the bars' own time zone. "Today" for the
 * daily dish, the events and the opening hours is a date in Eindhoven, whatever zone the server
 * runs in. Tests swap in a fixed clock.
 */
@Configuration
public class TimeConfig {

    public static final ZoneId BAR_ZONE = ZoneId.of("Europe/Amsterdam");

    @Bean
    public Clock clock() {
        return Clock.system(BAR_ZONE);
    }
}
