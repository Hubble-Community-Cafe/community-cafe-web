package cafe.community.backend.dto;

import cafe.community.backend.model.HoursOverride;

import java.time.format.DateTimeFormatter;

public record HoursOverrideDto(
        Long id,
        String bar,
        String date,
        boolean closed,
        String open,
        String close,
        String note
) {
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public static HoursOverrideDto from(HoursOverride o) {
        return new HoursOverrideDto(
                o.getId(),
                o.getBar().name(),
                o.getDate().toString(),
                o.isClosed(),
                o.getOpen() != null ? o.getOpen().format(TIME_FMT) : null,
                o.getClose() != null ? o.getClose().format(TIME_FMT) : null,
                o.getNote()
        );
    }
}
