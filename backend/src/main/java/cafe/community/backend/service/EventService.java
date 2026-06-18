package cafe.community.backend.service;

import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.Event;
import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.EventRepository;
import cafe.community.backend.repository.MediaAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class EventService {

    private static final ZoneId TZ = ZoneId.of("Europe/Amsterdam");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final EventRepository eventRepo;
    private final MediaAssetRepository mediaRepo;

    public EventService(EventRepository eventRepo, MediaAssetRepository mediaRepo) {
        this.eventRepo = eventRepo;
        this.mediaRepo = mediaRepo;
    }

    /** Upcoming published events for a bar, from today onwards. */
    @Transactional(readOnly = true)
    public List<EventDto> getUpcoming(BarLocation bar) {
        LocalDate today = LocalDate.now(TZ);
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
        return EventDto.from(eventRepo.save(event));
    }

    public EventDto update(Long id, EventRequest req) {
        Event event = eventRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
        apply(event, req);
        return EventDto.from(eventRepo.save(event));
    }

    public void delete(Long id) {
        if (!eventRepo.existsById(id)) throw new EntityNotFoundException("Event not found: " + id);
        eventRepo.deleteById(id);
    }

    private void apply(Event event, EventRequest req) {
        event.setBar(BarLocation.valueOf(req.bar()));
        event.setTitle(req.title());
        event.setDescription(req.description());
        event.setDate(req.date());
        event.setStartTime(req.startTime() != null && !req.startTime().isBlank()
                ? LocalTime.parse(req.startTime(), TIME_FMT) : null);
        event.setPrice(req.price());
        event.setSubscribeLink(req.subscribeLink());
        event.setPublished(req.published());
        MediaAsset image = req.imageId() != null
                ? mediaRepo.findById(req.imageId()).orElse(null) : null;
        event.setImage(image);
    }
}
