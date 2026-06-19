package cafe.community.backend.dto;

import cafe.community.backend.model.Association;

public record AssociationDto(
        Long id,
        String name,
        Long logoId,
        String logoUrl,
        String logoAlt,
        String bar
) {
    public static AssociationDto from(Association a) {
        return new AssociationDto(
                a.getId(),
                a.getName(),
                a.getLogo() != null ? a.getLogo().getId() : null,
                a.getLogo() != null ? a.getLogo().getUrl() : null,
                a.getLogo() != null ? a.getLogo().getAlt() : null,
                a.getBar() != null ? a.getBar().name() : null
        );
    }
}
