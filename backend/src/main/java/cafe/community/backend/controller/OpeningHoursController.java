package cafe.community.backend.controller;

import cafe.community.backend.dto.BarStatusDto;
import cafe.community.backend.dto.HoursOverrideDto;
import cafe.community.backend.dto.WeeklyHoursDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.OpeningHoursService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) opening-hours endpoints consumed by both public sites. */
@RestController
@RequestMapping("/api/opening-hours")
public class OpeningHoursController {

    private final OpeningHoursService service;

    public OpeningHoursController(OpeningHoursService service) {
        this.service = service;
    }

    /** Weekly schedule for a bar, ordered Monday to Sunday. */
    @GetMapping("/{bar}")
    public List<WeeklyHoursDto> weeklyHours(@PathVariable BarLocation bar) {
        return service.getWeeklyHours(bar);
    }

    /** Today's open/closed status, accounting for any date override. */
    @GetMapping("/{bar}/status")
    public BarStatusDto status(@PathVariable BarLocation bar) {
        return service.getStatus(bar);
    }

    /** Upcoming date overrides (today and future) so public visitors can see special closures. */
    @GetMapping("/{bar}/overrides")
    public List<HoursOverrideDto> upcomingOverrides(@PathVariable BarLocation bar) {
        return service.getUpcomingOverrides(bar);
    }
}
