package cafe.community.backend.dto;

import cafe.community.backend.model.OpeningHours;

import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;

public record WeeklyHoursDto(
        Long id,
        String bar,
        DayOfWeek dayOfWeek,
        String open,
        String close,
        String kitchenOpen,
        String kitchenClose
) {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm");

    public static WeeklyHoursDto from(OpeningHours h) {
        return new WeeklyHoursDto(
                h.getId(),
                h.getBar().name(),
                h.getDayOfWeek(),
                h.getOpen().format(FMT),
                h.getClose().format(FMT),
                h.getKitchenOpen() != null ? h.getKitchenOpen().format(FMT) : null,
                h.getKitchenClose() != null ? h.getKitchenClose().format(FMT) : null
        );
    }
}
