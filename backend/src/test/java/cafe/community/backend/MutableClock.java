package cafe.community.backend;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

/** A clock a test sets and moves by hand, so nothing depends on wall-clock timing. */
public final class MutableClock extends Clock {

    private final ZoneId zone;
    private Instant now;

    public MutableClock(Instant now) {
        this(now, ZoneId.of("UTC"));
    }

    public MutableClock(Instant now, ZoneId zone) {
        this.now = now;
        this.zone = zone;
    }

    public void advance(Duration amount) {
        now = now.plus(amount);
    }

    @Override
    public Instant instant() {
        return now;
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new MutableClock(now, zone);
    }
}
