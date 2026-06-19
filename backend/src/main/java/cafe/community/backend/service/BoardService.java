package cafe.community.backend.service;

import cafe.community.backend.dto.BoardMemberDto;
import cafe.community.backend.dto.BoardMemberRequest;
import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.dto.BoardTermRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.BoardMemberRepository;
import cafe.community.backend.repository.BoardTermRepository;
import cafe.community.backend.repository.MediaAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BoardService {

    private final BoardTermRepository termRepo;
    private final BoardMemberRepository memberRepo;
    private final MediaAssetRepository mediaRepo;
    private final AuditService auditService;

    public BoardService(BoardTermRepository termRepo, BoardMemberRepository memberRepo,
                        MediaAssetRepository mediaRepo, AuditService auditService) {
        this.termRepo = termRepo;
        this.memberRepo = memberRepo;
        this.mediaRepo = mediaRepo;
        this.auditService = auditService;
    }

    public List<BoardTermDto> getAll() {
        return termRepo.findAll(org.springframework.data.domain.Sort.by("sortOrder", "label"))
                .stream().map(BoardTermDto::from).toList();
    }

    public BoardTermDto createTerm(BoardTermRequest req) {
        BoardTerm term = new BoardTerm();
        applyTerm(term, req);
        BoardTerm saved = termRepo.save(term);
        auditService.recordCreate(AuditEntityType.BOARD_TERM, saved.getId(), saved.getLabel(),
                List.of(), "Created board term: " + saved.getLabel() + " (" + saved.getType().name() + ")");
        return BoardTermDto.from(saved);
    }

    public BoardTermDto updateTerm(Long id, BoardTermRequest req) {
        BoardTerm term = termRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Board term not found: " + id));
        applyTerm(term, req);
        BoardTerm saved = termRepo.save(term);
        auditService.recordAction(AuditEntityType.BOARD_TERM, saved.getId(), saved.getLabel(),
                AuditAction.UPDATE, List.of(),
                "Updated board term: " + saved.getLabel() + " (" + saved.getType().name() + ")");
        return BoardTermDto.from(saved);
    }

    public void deleteTerm(Long id) {
        BoardTerm term = termRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Board term not found: " + id));
        String label = term.getLabel();
        termRepo.deleteById(id);
        auditService.recordDelete(AuditEntityType.BOARD_TERM, id, label,
                "Deleted board term: " + label);
    }

    public BoardMemberDto createMember(Long termId, BoardMemberRequest req) {
        BoardTerm term = termRepo.findById(termId)
                .orElseThrow(() -> new EntityNotFoundException("Board term not found: " + termId));
        BoardMember member = new BoardMember();
        member.setTerm(term);
        applyMember(member, req);
        BoardMember saved = memberRepo.save(member);
        term.getMembers().add(saved);
        auditService.recordCreate(AuditEntityType.BOARD_MEMBER, saved.getId(), saved.getName(),
                List.of(), "Added board member: " + saved.getName() + " to \"" + term.getLabel() + "\"");
        return BoardMemberDto.from(saved);
    }

    public BoardMemberDto updateMember(Long id, BoardMemberRequest req) {
        BoardMember member = memberRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Board member not found: " + id));
        applyMember(member, req);
        BoardMember saved = memberRepo.save(member);
        auditService.recordAction(AuditEntityType.BOARD_MEMBER, saved.getId(), saved.getName(),
                AuditAction.UPDATE, List.of(),
                "Updated board member: " + saved.getName());
        return BoardMemberDto.from(saved);
    }

    public void deleteMember(Long id) {
        BoardMember member = memberRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Board member not found: " + id));
        String name = member.getName();
        memberRepo.deleteById(id);
        auditService.recordDelete(AuditEntityType.BOARD_MEMBER, id, name,
                "Removed board member: " + name);
    }

    private void applyTerm(BoardTerm term, BoardTermRequest req) {
        term.setLabel(req.label());
        term.setType(BoardType.valueOf(req.type()));
        term.setBar(req.bar() != null && !req.bar().isBlank() ? BarLocation.valueOf(req.bar()) : null);
        term.setCurrent(req.current());
        term.setSortOrder(req.sortOrder());
        term.setPhotoCredit(req.photoCredit());
        MediaAsset groupPhoto = req.groupPhotoId() != null
                ? mediaRepo.findById(req.groupPhotoId()).orElse(null) : null;
        term.setGroupPhoto(groupPhoto);
    }

    private void applyMember(BoardMember member, BoardMemberRequest req) {
        member.setName(req.name());
        member.setRole(req.role());
        member.setSortOrder(req.sortOrder());
        MediaAsset photo = req.photoId() != null
                ? mediaRepo.findById(req.photoId()).orElse(null) : null;
        member.setPhoto(photo);
    }
}
