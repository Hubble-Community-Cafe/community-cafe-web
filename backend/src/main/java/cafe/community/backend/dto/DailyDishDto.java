package cafe.community.backend.dto;

import cafe.community.backend.model.DailyDish;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyDishDto(
        Long id,
        LocalDate date,
        String name,
        String description,
        BigDecimal price,
        String imageUrl
) {
    public static DailyDishDto from(DailyDish dish) {
        String imageUrl = dish.getImage() != null ? dish.getImage().getUrl() : null;
        return new DailyDishDto(dish.getId(), dish.getDate(), dish.getName(),
                dish.getDescription(), dish.getPrice(), imageUrl);
    }
}
