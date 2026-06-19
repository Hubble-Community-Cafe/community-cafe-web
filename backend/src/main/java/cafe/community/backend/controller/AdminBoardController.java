package cafe.community.backend.controller;

import cafe.community.backend.dto.BoardMemberDto;
import cafe.community.backend.dto.BoardMemberRequest;
import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.dto.BoardTermRequest;
import cafe.community.backend.service.BoardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
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
    public BoardTermDto createTerm(@Valid @RequestBody BoardTermRequest req) {
        return service.createTerm(req);
    }

    @PutMapping("/terms/{id}")
    public BoardTermDto updateTerm(@PathVariable Long id, @Valid @RequestBody BoardTermRequest req) {
        return service.updateTerm(id, req);
    }

    @DeleteMapping("/terms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTerm(@PathVariable Long id) {
        service.deleteTerm(id);
    }

    @PostMapping("/terms/{termId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardMemberDto createMember(@PathVariable Long termId, @Valid @RequestBody BoardMemberRequest req) {
        return service.createMember(termId, req);
    }

    @PutMapping("/members/{id}")
    public BoardMemberDto updateMember(@PathVariable Long id, @Valid @RequestBody BoardMemberRequest req) {
        return service.updateMember(id, req);
    }

    @DeleteMapping("/members/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMember(@PathVariable Long id) {
        service.deleteMember(id);
    }
}
