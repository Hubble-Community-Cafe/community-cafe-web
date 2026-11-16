package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record EventRequest(
        @NotBlank String bar,
        @NotBlank String title,
        String description,
        @NotNull LocalDate date,
        // Checked here so a typo is a clear 400 instead of a parse failure (500) in the service.
        @Pattern(regexp = START_TIME, message = "must be a time like 20:30")
        String startTime,
        String price,
        // Rendered as a link on the public sites: web links only, never javascript: or data:.
        @Pattern(regexp = WEB_LINK, message = "must start with https:// or http://")
        String subscribeLink,
        Long imageId,
        boolean published
) {
    /** An http(s) link without spaces, or empty. Null is allowed too (no link). */
    public static final String WEB_LINK = "^$|^(?i)https?://\\S+$";

    /** A 24-hour HH:mm time (what the admin's time input sends), or empty for no start time. */
    static final String START_TIME = "^$|^([01]\\d|2[0-3]):[0-5]\\d$";
}
