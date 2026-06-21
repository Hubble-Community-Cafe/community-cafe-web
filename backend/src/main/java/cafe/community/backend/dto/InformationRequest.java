package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Hubble "Information form": a general question/message. {@code honeypot} must stay empty;
 * a filled value marks a bot.
 */
public record InformationRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Email @Size(max = 200) String email,
        @Size(max = 40) String phone,
        @NotBlank @Size(max = 5000) String message,
        String honeypot,
        /** ALTCHA proof-of-work payload (base64). */
        String altcha
) {}
