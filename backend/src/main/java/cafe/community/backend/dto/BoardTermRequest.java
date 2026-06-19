package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record BoardTermRequest(
        @NotBlank String label,
        @NotBlank String type,
        String bar,
        boolean current,
        int sortOrder,
        Long groupPhotoId,
        String photoCredit
) {}
