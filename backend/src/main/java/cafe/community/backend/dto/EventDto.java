package cafe.community.backend.dto;

import cafe.community.backend.model.Event;

import java.time.format.DateTimeFormatter;

public record EventDto(
        Long id,
        String bar,
        String title,
        String description,
        String date,
        String startTime,
        String price,
        String subscribeLink,
        Long imageId,
        String imageUrl,
        String imageAlt,
        boolean published
) {
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public static EventDto from(Event e) {
        return new EventDto(
                e.getId(),
                e.getBar().name(),
                e.getTitle(),
                e.getDescription(),
                e.getDate().toString(),
                e.getStartTime() != null ? e.getStartTime().format(TIME_FMT) : null,
                e.getPrice(),
                e.getSubscribeLink(),
                e.getImage() != null ? e.getImage().getId() : null,
                e.getImage() != null ? e.getImage().getUrl() : null,
                e.getImage() != null ? e.getImage().getAlt() : null,
                e.isPublished()
        );
    }
}
