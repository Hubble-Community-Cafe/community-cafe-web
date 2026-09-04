package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record BoardMemberRequest(
        @NotBlank String name,
        String role,
        Long photoId,
        /** Null on create means "put it last"; null on update leaves the position alone. */
        Integer sortOrder
) {}
