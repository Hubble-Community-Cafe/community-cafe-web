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
        /** Null on create means "put it last"; null on update leaves the position alone. */
        Integer sortOrder,
        BarLocation bar,
        Long parentId,
        /** Null means "visible": callers that omit the flag get an active category. */
        Boolean active
) {
    /** Convenience for callers that do not set visibility; the category stays visible. */
    public MenuCategoryRequest(String name, MenuKind kind, String availabilityNote,
                               Integer sortOrder, BarLocation bar, Long parentId) {
        this(name, kind, availabilityNote, sortOrder, bar, parentId, null);
    }
}
