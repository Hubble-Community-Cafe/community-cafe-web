package cafe.community.backend.dto;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuCategory;
import cafe.community.backend.model.MenuKind;

import java.util.List;

/** A category together with its (active) items: the shape returned to the public sites. */
public record MenuCategoryWithItemsDto(
        Long id,
        String name,
        MenuKind kind,
        String availabilityNote,
        int sortOrder,
        BarLocation bar,
        List<MenuItemDto> items
) {
    public static MenuCategoryWithItemsDto from(MenuCategory c, List<MenuItemDto> items) {
        return new MenuCategoryWithItemsDto(c.getId(), c.getName(), c.getKind(),
                c.getAvailabilityNote(), c.getSortOrder(), c.getBar(), items);
    }
}
