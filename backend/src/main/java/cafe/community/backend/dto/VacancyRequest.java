package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VacancyRequest(
        @NotBlank String title,
        String description,
        String hours,
        String type,
        // Rendered as a mailto: link on the public sites, so it must be a plain address.
        @Email(message = "must be an e-mail address") String applyEmail,
        // Rendered as a link on the public sites: web links only, never javascript: or data:.
        @Pattern(regexp = EventRequest.WEB_LINK, message = "must start with https:// or http://")
        String applyLink,
        Long imageId,
        String bar,
        boolean active,
        /** Null on create means "put it last"; null on update leaves the position alone. */
        Integer sortOrder
) {}
