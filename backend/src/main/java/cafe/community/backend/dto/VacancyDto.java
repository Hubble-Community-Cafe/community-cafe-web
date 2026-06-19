package cafe.community.backend.dto;

import cafe.community.backend.model.Vacancy;

public record VacancyDto(
        Long id,
        String title,
        String description,
        String hours,
        String type,
        String applyEmail,
        String applyLink,
        Long imageId,
        String imageUrl,
        String imageAlt,
        String bar,
        boolean active,
        int sortOrder
) {
    public static VacancyDto from(Vacancy v) {
        return new VacancyDto(
                v.getId(),
                v.getTitle(),
                v.getDescription(),
                v.getHours(),
                v.getType(),
                v.getApplyEmail(),
                v.getApplyLink(),
                v.getImage() != null ? v.getImage().getId() : null,
                v.getImage() != null ? v.getImage().getUrl() : null,
                v.getImage() != null ? v.getImage().getAlt() : null,
                v.getBar() != null ? v.getBar().name() : null,
                v.isActive(),
                v.getSortOrder()
        );
    }
}
