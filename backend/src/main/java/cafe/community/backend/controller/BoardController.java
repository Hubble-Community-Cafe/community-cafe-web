package cafe.community.backend.controller;

import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.service.BoardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public read-only endpoint: public sites fetch all board terms and members. */
@RestController
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService service;

    public BoardController(BoardService service) {
        this.service = service;
    }

    @GetMapping
    public List<BoardTermDto> getAll() {
        return service.getAll();
    }
}
