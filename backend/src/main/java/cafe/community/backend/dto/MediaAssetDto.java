package cafe.community.backend.dto;

import cafe.community.backend.model.MediaAsset;

public record MediaAssetDto(
        Long id,
        String filename,
        String contentType,
        String url,
        String alt,
        Long sizeBytes,
        String bar,
        String createdAt
) {
    public static MediaAssetDto from(MediaAsset a) {
        return new MediaAssetDto(
                a.getId(),
                a.getFilename(),
                a.getContentType(),
                a.getUrl(),
                a.getAlt(),
                a.getSizeBytes(),
                a.getBar() != null ? a.getBar().name() : null,
                a.getCreatedAt().toString()
        );
    }
}
