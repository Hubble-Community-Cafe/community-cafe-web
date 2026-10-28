package cafe.community.backend.controller;

import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for events. Reads need Events view; writes need Events edit. */
@RestController
@PreAuthorize("hasAuthority('EVENTS_VIEW')")
@RequestMapping("/api/admin/events")
public class AdminEventController {

    private final EventService service;

    public AdminEventController(EventService service) {
        this.service = service;
    }

    /** All events for a bar (past and future), newest first. */
    @GetMapping("/{bar}")
    public List<EventDto> all(@PathVariable BarLocation bar) {
        return service.getAll(bar);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('EVENTS_EDIT')")
    public EventDto create(@Valid @RequestBody EventRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EVENTS_EDIT')")
    public EventDto update(@PathVariable Long id, @Valid @RequestBody EventRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('EVENTS_EDIT')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
