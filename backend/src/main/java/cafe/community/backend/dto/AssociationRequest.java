package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AssociationRequest(
        @NotBlank String name,
        Long logoId,
        String bar
) {}
