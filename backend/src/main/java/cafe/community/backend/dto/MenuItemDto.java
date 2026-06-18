package cafe.community.backend.dto;

import cafe.community.backend.model.MenuItem;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

public record MenuItemDto(
        Long id,
        Long categoryId,
        String name,
        String description,
        BigDecimal regularPrice,
        BigDecimal studentPrice,
        List<String> sizeOptions,
        List<String> dietaryTags,
        List<String> allergens,
        String imageUrl,
        int sortOrder,
        boolean active
) {
    public static MenuItemDto from(MenuItem item) {
        String imageUrl = item.getImage() != null ? item.getImage().getUrl() : null;
        return new MenuItemDto(
                item.getId(),
                item.getCategory().getId(),
                item.getName(),
                item.getDescription(),
                item.getRegularPrice(),
                item.getStudentPrice(),
                splitCsv(item.getSizeOptions()),
                splitCsv(item.getDietaryTags()),
                splitCsv(item.getAllergens()),
                imageUrl,
                item.getSortOrder(),
                item.isActive()
        );
    }

    private static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
