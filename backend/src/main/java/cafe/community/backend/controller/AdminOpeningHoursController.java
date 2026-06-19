package cafe.community.backend.controller;

import cafe.community.backend.dto.HoursOverrideDto;
import cafe.community.backend.dto.HoursOverrideRequest;
import cafe.community.backend.dto.WeeklyHoursDto;
import cafe.community.backend.dto.WeeklyHoursRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.OpeningHoursService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

/** Opening hours and date overrides. Reads open to any signed-in staff; writes require EDITOR. */
@RestController
@RequestMapping("/api/admin/opening-hours")
public class AdminOpeningHoursController {

    private final OpeningHoursService service;

    public AdminOpeningHoursController(OpeningHoursService service) {
        this.service = service;
    }

    /** Upsert standing hours for one day of the week. */
    @PutMapping("/{bar}/{day}")
    @PreAuthorize("hasRole('EDITOR')")
    public WeeklyHoursDto upsertDay(
            @PathVariable BarLocation bar,
            @PathVariable DayOfWeek day,
            @Valid @RequestBody WeeklyHoursRequest req
    ) {
        return service.upsertDay(bar, day, req);
    }

    /** Mark a day as closed (removes the standing-hours row for that day). */
    @DeleteMapping("/{bar}/{day}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void closeDay(@PathVariable BarLocation bar, @PathVariable DayOfWeek day) {
        service.closeDay(bar, day);
    }

    /** List upcoming overrides (today and future) for a bar. */
    @GetMapping("/{bar}/overrides")
    public List<HoursOverrideDto> overrides(@PathVariable BarLocation bar) {
        return service.getUpcomingOverrides(bar);
    }

    /** Add a one-off date override. */
    @PostMapping("/{bar}/overrides")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EDITOR')")
    public HoursOverrideDto createOverride(
            @PathVariable BarLocation bar,
            @Valid @RequestBody HoursOverrideRequest req
    ) {
        return service.createOverride(bar, req);
    }

    /** Remove a date override. */
    @DeleteMapping("/overrides/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void deleteOverride(@PathVariable Long id) {
        service.deleteOverride(id);
    }
}
