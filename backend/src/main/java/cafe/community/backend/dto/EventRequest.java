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
}
