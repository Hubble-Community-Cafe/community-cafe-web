package cafe.community.backend.dto;

import cafe.community.backend.model.BoardTerm;

import java.util.List;

public record BoardTermDto(
        Long id,
        String label,
        String type,
        String bar,
        boolean current,
        int sortOrder,
        Long groupPhotoId,
        String groupPhotoUrl,
        String groupPhotoAlt,
        String photoCredit,
        List<BoardMemberDto> members
) {
    public static BoardTermDto from(BoardTerm t) {
        return new BoardTermDto(
                t.getId(),
                t.getLabel(),
                t.getType().name(),
                t.getBar() != null ? t.getBar().name() : null,
                t.isCurrent(),
                t.getSortOrder(),
                t.getGroupPhoto() != null ? t.getGroupPhoto().getId() : null,
                t.getGroupPhoto() != null ? t.getGroupPhoto().getUrl() : null,
                t.getGroupPhoto() != null ? t.getGroupPhoto().getAlt() : null,
                t.getPhotoCredit(),
                t.getMembers().stream().map(BoardMemberDto::from).toList()
        );
    }
}
