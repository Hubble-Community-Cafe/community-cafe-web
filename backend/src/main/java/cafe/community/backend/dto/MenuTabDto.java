package cafe.community.backend.dto;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuCategory;
import cafe.community.backend.model.MenuKind;

import java.util.List;

/** A top-level tab with its sub-categories and their items: the public-facing menu shape. */
public record MenuTabDto(
        Long id,
        String name,
        MenuKind kind,
        String availabilityNote,
        int sortOrder,
        BarLocation bar,
        List<MenuCategoryWithItemsDto> categories
) {
    public static MenuTabDto from(MenuCategory tab, List<MenuCategoryWithItemsDto> categories) {
        return new MenuTabDto(tab.getId(), tab.getName(), tab.getKind(),
                tab.getAvailabilityNote(), tab.getSortOrder(), tab.getBar(), categories);
    }
}
