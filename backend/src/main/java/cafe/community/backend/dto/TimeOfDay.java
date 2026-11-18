package cafe.community.backend.dto;

/**
 * Validation for a time of day in admin requests: a real 24-hour HH:mm time, 00:00 to 23:59, which
 * is what the admin's time inputs send. Checked on the request, because the services parse these
 * strings and anything else (99:99, 24:00, 8pm) would otherwise fail there as a server error.
 */
final class TimeOfDay {

    /** For {@code @Pattern}, which matches the whole value. */
    static final String HH_MM = "([01]\\d|2[0-3]):[0-5]\\d";
    static final String MESSAGE = "must be a time like 20:30";

    private TimeOfDay() {
    }
}
