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

/** Admin CRUD for events. Reads open to any signed-in staff; writes require EDITOR. */
@RestController
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
    @PreAuthorize("hasRole('EDITOR')")
    public EventDto create(@Valid @RequestBody EventRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EDITOR')")
    public EventDto update(@PathVariable Long id, @Valid @RequestBody EventRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
