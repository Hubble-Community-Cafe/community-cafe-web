package cafe.community.backend.controller;

import cafe.community.backend.dto.BoardMemberDto;
import cafe.community.backend.dto.BoardMemberRequest;
import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.dto.BoardTermRequest;
import cafe.community.backend.dto.ReorderRequest;
import cafe.community.backend.service.BoardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for the board. Reads need Board view; writes need Board edit. */
@RestController
@PreAuthorize("hasAuthority('BOARD_VIEW')")
@RequestMapping("/api/admin/board")
public class AdminBoardController {

    private final BoardService service;

    public AdminBoardController(BoardService service) {
        this.service = service;
    }

    @GetMapping("/terms")
    public List<BoardTermDto> listTerms() {
        return service.getAll();
    }

    @PostMapping("/terms")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public BoardTermDto createTerm(@Valid @RequestBody BoardTermRequest req) {
        return service.createTerm(req);
    }

    @PutMapping("/terms/{id}")
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public BoardTermDto updateTerm(@PathVariable Long id, @Valid @RequestBody BoardTermRequest req) {
        return service.updateTerm(id, req);
    }

    /** Apply a dragged order to the board terms. */
    @PatchMapping("/terms/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public void reorderTerms(@Valid @RequestBody ReorderRequest req) {
        service.reorderTerms(req.orderedIds());
    }

    @DeleteMapping("/terms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public void deleteTerm(@PathVariable Long id) {
        service.deleteTerm(id);
    }

    @PostMapping("/terms/{termId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public BoardMemberDto createMember(@PathVariable Long termId, @Valid @RequestBody BoardMemberRequest req) {
        return service.createMember(termId, req);
    }

    @PutMapping("/members/{id}")
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public BoardMemberDto updateMember(@PathVariable Long id, @Valid @RequestBody BoardMemberRequest req) {
        return service.updateMember(id, req);
    }

    /** Apply a dragged order to the members of one term. */
    @PatchMapping("/terms/{termId}/members/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public void reorderMembers(@PathVariable Long termId, @Valid @RequestBody ReorderRequest req) {
        service.reorderMembers(termId, req.orderedIds());
    }

    @DeleteMapping("/members/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('BOARD_EDIT')")
    public void deleteMember(@PathVariable Long id) {
        service.deleteMember(id);
    }
}
