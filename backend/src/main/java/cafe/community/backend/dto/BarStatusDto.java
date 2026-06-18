package cafe.community.backend.dto;

public record BarStatusDto(
        String bar,
        boolean isOpen,
        String bannerMessage
) {}
