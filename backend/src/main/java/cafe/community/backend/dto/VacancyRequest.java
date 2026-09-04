package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record VacancyRequest(
        @NotBlank String title,
        String description,
        String hours,
        String type,
        String applyEmail,
        String applyLink,
        Long imageId,
        String bar,
        boolean active,
        /** Null on create means "put it last"; null on update leaves the position alone. */
        Integer sortOrder
) {}
