package cafe.community.backend.dto;

import cafe.community.backend.model.BoardMember;

public record BoardMemberDto(
        Long id,
        Long termId,
        String name,
        String role,
        Long photoId,
        String photoUrl,
        String photoAlt,
        int sortOrder
) {
    public static BoardMemberDto from(BoardMember m) {
        return new BoardMemberDto(
                m.getId(),
                m.getTerm().getId(),
                m.getName(),
                m.getRole(),
                m.getPhoto() != null ? m.getPhoto().getId() : null,
                m.getPhoto() != null ? m.getPhoto().getUrl() : null,
                m.getPhoto() != null ? m.getPhoto().getAlt() : null,
                m.getSortOrder()
        );
    }
}
