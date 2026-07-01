package cafe.community.backend.controller;

import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.service.AnalyticsService;
import cafe.community.backend.service.BoardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public read-only endpoint: public sites fetch all board terms and members. */
@RestController
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService service;
    private final AnalyticsService analytics;

    public BoardController(BoardService service, AnalyticsService analytics) {
        this.service = service;
        this.analytics = analytics;
    }

    /** Board is shared across both sites, so the site is derived from the request headers only. */
    @GetMapping
    public List<BoardTermDto> getAll(HttpServletRequest request) {
        analytics.logPageView("board", request);
        return service.getAll();
    }
}
