package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Hubble "Tips, Complaints & Ideas" form. Like the Meteor one, plus a "wants updates" flag.
 * {@code honeypot} must stay empty: a real user never sees it, so a filled value marks a bot.
 */
public record TipRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Email @Size(max = 200) String email,
        @Size(max = 40) String phone,
        @Size(max = 20) String date,
        @NotBlank @Pattern(regexp = "TIP|COMPLAINT|IDEA", message = "must be TIP, COMPLAINT or IDEA")
        String type,
        @NotBlank @Size(max = 5000) String message,
        Boolean wantsUpdates,
        String honeypot,
        /** ALTCHA proof-of-work payload (base64). */
        String altcha
) {}
