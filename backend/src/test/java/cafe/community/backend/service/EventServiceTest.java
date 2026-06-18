package cafe.community.backend.service;

import cafe.community.backend.dto.EventDto;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EventServiceTest {

    @Autowired EventService service;
    @Autowired EventRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private EventRequest req(String bar, String title, LocalDate date, boolean published) {
        return new EventRequest(bar, title, null, date, null, null, null, null, published);
    }

    @Test
    void create_and_getUpcoming() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        service.create(req("HUBBLE", "Quiz Night", tomorrow, true));

        List<EventDto> upcoming = service.getUpcoming(BarLocation.HUBBLE);
        assertThat(upcoming).hasSize(1);
        assertThat(upcoming.get(0).title()).isEqualTo("Quiz Night");
    }

    @Test
    void getUpcoming_excludesPastEvents() {
        service.create(req("HUBBLE", "Old Event", LocalDate.now().minusDays(1), true));
        service.create(req("HUBBLE", "Future Event", LocalDate.now().plusDays(1), true));

        assertThat(service.getUpcoming(BarLocation.HUBBLE))
                .extracting(EventDto::title)
                .containsExactly("Future Event");
    }

    @Test
    void getUpcoming_excludesUnpublished() {
        service.create(req("HUBBLE", "Draft", LocalDate.now().plusDays(1), false));
        assertThat(service.getUpcoming(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void getUpcoming_isolatedByBar() {
        service.create(req("HUBBLE", "Hubble Event", LocalDate.now().plusDays(1), true));
        service.create(req("METEOR", "Meteor Event", LocalDate.now().plusDays(1), true));

        assertThat(service.getUpcoming(BarLocation.HUBBLE))
                .extracting(EventDto::title).containsExactly("Hubble Event");
        assertThat(service.getUpcoming(BarLocation.METEOR))
                .extracting(EventDto::title).containsExactly("Meteor Event");
    }

    @Test
    void update_changesFields() {
        EventDto created = service.create(req("HUBBLE", "Original", LocalDate.now().plusDays(1), true));
        LocalDate newDate = LocalDate.now().plusDays(7);
        EventDto updated = service.update(created.id(),
                new EventRequest("HUBBLE", "Updated", "Desc", newDate, "20:00", "Free", null, null, true));

        assertThat(updated.title()).isEqualTo("Updated");
        assertThat(updated.description()).isEqualTo("Desc");
        assertThat(updated.startTime()).isEqualTo("20:00");
        assertThat(updated.price()).isEqualTo("Free");
    }

    @Test
    void delete_removesEvent() {
        EventDto created = service.create(req("HUBBLE", "To Delete", LocalDate.now().plusDays(1), true));
        service.delete(created.id());
        assertThat(repo.existsById(created.id())).isFalse();
    }

    @Test
    void getAll_returnsPastAndFuture() {
        service.create(req("HUBBLE", "Past", LocalDate.now().minusDays(5), false));
        service.create(req("HUBBLE", "Future", LocalDate.now().plusDays(5), true));

        assertThat(service.getAll(BarLocation.HUBBLE)).hasSize(2);
    }
}
