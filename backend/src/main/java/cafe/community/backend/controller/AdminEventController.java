package cafe.community.backend.controller;

import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Authenticated admin CRUD for events. */
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
    public EventDto create(@Valid @RequestBody EventRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public EventDto update(@PathVariable Long id, @Valid @RequestBody EventRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
