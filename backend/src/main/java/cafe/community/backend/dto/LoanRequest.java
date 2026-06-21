package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Hubble "Loan Equipment" request. All fields are required (the old WordPress form marked them
 * so). {@code honeypot} must stay empty; a filled value marks a bot.
 */
public record LoanRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 200) String association,
        @NotBlank @Email @Size(max = 200) String email,
        @NotBlank @Size(max = 20) String pickupDate,
        @NotBlank @Size(max = 20) String pickupTime,
        @NotBlank @Size(max = 20) String returnDate,
        @NotBlank @Size(max = 20) String returnTime,
        @NotBlank @Size(max = 5000) String message,
        String honeypot,
        /** ALTCHA proof-of-work payload (base64). */
        String altcha
) {}
