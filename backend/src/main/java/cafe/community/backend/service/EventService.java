package cafe.community.backend.service;

import java.time.Clock;
import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.EventRepository;
import cafe.community.backend.service.audit.AuditSnapshots;
import cafe.community.backend.service.audit.Audited;
import cafe.community.backend.service.audit.Snapshot;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class EventService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final EventRepository eventRepo;
    private final MediaService media;
    private final AuditService auditService;
    private final Clock clock;

    /** Summaries name the bar and date too: two bars can run an event with the same title. */
    private static final Audited<Event> EVENT = new Audited<>(AuditEntityType.EVENT, "event", Event::getId, Event::getTitle,
            e -> e.getTitle() + " (" + e.getBar().name() + ", " + e.getDate() + ")", AuditSnapshots::of);


    public EventService(EventRepository eventRepo, MediaService media, AuditService auditService, Clock clock) {
        this.eventRepo = eventRepo;
        this.media = media;
        this.auditService = auditService;
        this.clock = clock;
    }

    /** Upcoming published events for a bar, from today onwards. */
    @Transactional(readOnly = true)
    public List<EventDto> getUpcoming(BarLocation bar) {
        LocalDate today = LocalDate.now(clock);
        return eventRepo.findUpcoming(bar, today).stream().map(EventDto::from).toList();
    }

    /** All events for a bar (admin view), newest first. */
    @Transactional(readOnly = true)
    public List<EventDto> getAll(BarLocation bar) {
        return eventRepo.findAllByBarOrderByDateDescStartTimeDesc(bar)
                .stream().map(EventDto::from).toList();
    }

    public EventDto create(EventRequest req) {
        Event event = new Event();
        apply(event, req);
        Event saved = eventRepo.save(event);
        auditService.created(EVENT, saved);
        return EventDto.from(saved);
    }

    public EventDto update(Long id, EventRequest req) {
        Event event = eventRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
        Snapshot before = EVENT.snapshot(event);
        apply(event, req);
        Event saved = eventRepo.save(event);
        auditService.updated(EVENT, before, saved);
        return EventDto.from(saved);
    }

    public void delete(Long id) {
        Event event = eventRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
        auditService.deleted(EVENT, event);
        eventRepo.deleteById(id);
    }

    private void apply(Event event, EventRequest req) {
        // Never null here: EventRequest.bar is @NotBlank, events always belong to one bar.
        event.setBar(BarLocation.parseOrShared(req.bar()));
        event.setTitle(req.title());
        event.setDescription(req.description());
        event.setDate(req.date());
        event.setStartTime(req.startTime() != null && !req.startTime().isBlank()
                ? LocalTime.parse(req.startTime(), TIME_FMT) : null);
        event.setPrice(req.price());
        event.setSubscribeLink(req.subscribeLink());
        event.setPublished(req.published());
        event.setImage(media.resolve(req.imageId()));
    }
}
