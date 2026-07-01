package cafe.community.backend.controller;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.AnalyticsService;
import cafe.community.backend.service.AssociationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) associations endpoint consumed by both public sites. */
@RestController
@RequestMapping("/api/associations")
public class AssociationController {

    private final AssociationService service;
    private final AnalyticsService analytics;

    public AssociationController(AssociationService service, AnalyticsService analytics) {
        this.service = service;
        this.analytics = analytics;
    }

    @GetMapping("/{bar}")
    public List<AssociationDto> forBar(@PathVariable BarLocation bar, HttpServletRequest request) {
        analytics.logPageView("associations", request, bar);
        return service.getForBar(bar);
    }
}
