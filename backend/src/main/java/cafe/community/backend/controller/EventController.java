package cafe.community.backend.controller;

import cafe.community.backend.dto.EventDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.AnalyticsService;
import cafe.community.backend.service.EventService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) events endpoint consumed by both public sites. */
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService service;
    private final AnalyticsService analytics;

    public EventController(EventService service, AnalyticsService analytics) {
        this.service = service;
        this.analytics = analytics;
    }

    /** Upcoming published events for a bar, sorted date ascending. */
    @GetMapping("/{bar}")
    public List<EventDto> upcoming(@PathVariable BarLocation bar, HttpServletRequest request) {
        analytics.logPageView("events", request, bar);
        return service.getUpcoming(bar);
    }
}
