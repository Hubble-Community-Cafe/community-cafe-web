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
        int sortOrder
) {}
