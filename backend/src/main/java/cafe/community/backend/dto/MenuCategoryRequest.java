package cafe.community.backend.dto;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MenuCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull MenuKind kind,
        @Size(max = 255) String availabilityNote,
        int sortOrder,
        BarLocation bar,
        Long parentId
) {}
