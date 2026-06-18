package cafe.community.backend.dto;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuCategory;
import cafe.community.backend.model.MenuKind;

public record MenuCategoryDto(
        Long id,
        String name,
        MenuKind kind,
        String availabilityNote,
        int sortOrder,
        BarLocation bar,
        Long parentId
) {
    public static MenuCategoryDto from(MenuCategory c) {
        return new MenuCategoryDto(c.getId(), c.getName(), c.getKind(),
                c.getAvailabilityNote(), c.getSortOrder(), c.getBar(),
                c.getParent() != null ? c.getParent().getId() : null);
    }
}
