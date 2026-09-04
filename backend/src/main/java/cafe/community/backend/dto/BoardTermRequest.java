package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record BoardTermRequest(
        @NotBlank String label,
        @NotBlank String type,
        String bar,
        boolean current,
        /** Null on create means "put it last"; null on update leaves the position alone. */
        Integer sortOrder,
        Long groupPhotoId,
        String photoCredit
) {}
