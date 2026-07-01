package cafe.community.backend.controller;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.AnalyticsService;
import cafe.community.backend.service.VacancyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) vacancies endpoint consumed by both public sites. */
@RestController
@RequestMapping("/api/vacancies")
public class VacancyController {

    private final VacancyService service;
    private final AnalyticsService analytics;

    public VacancyController(VacancyService service, AnalyticsService analytics) {
        this.service = service;
        this.analytics = analytics;
    }

    @GetMapping("/{bar}")
    public List<VacancyDto> active(@PathVariable BarLocation bar, HttpServletRequest request) {
        analytics.logPageView("vacancies", request, bar);
        return service.getActive(bar);
    }
}
