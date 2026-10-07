package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * Hubble "Poster Screens" request. Multipart (the poster file is uploaded alongside the
 * fields). Cross-field rules (end date after start date, file type/size) are enforced in
 * the service; here we cover the per-field shape.
 *
 * <p>There is no cafe field: Hubble and Meteor share the same screens. A {@code cafe} value
 * posted by an old cached frontend is simply not bound.
 */
@Data
public class ScreenRequest {

    @NotBlank
    @Size(max = 200)
    private String name;

    @NotBlank
    @Size(max = 200)
    private String association;

    @NotBlank
    @Email
    @Size(max = 200)
    private String email;

    /** Required unless {@link #permanent} is set; validated in the service. */
    @Size(max = 20)
    private String startDate;

    @Size(max = 20)
    private String endDate;

    /** A permanent (general) association poster has no fixed dates and is not an event poster. */
    private boolean permanent;

    /** Optional clock/progress-bar colour, e.g. "#FFF200". */
    @Pattern(regexp = "^$|^#?[0-9A-Fa-f]{6}$", message = "must be a 6-digit hex colour like #FFF200")
    private String hexColor;

    @Size(max = 5000)
    private String message;

    private MultipartFile file;

    private String honeypot;

    /** ALTCHA proof-of-work payload (base64). */
    private String altcha;
}
