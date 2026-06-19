package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record BoardMemberRequest(
        @NotBlank String name,
        String role,
        Long photoId,
        int sortOrder
) {}
