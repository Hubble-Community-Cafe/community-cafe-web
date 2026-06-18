package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    /** Upcoming published events for a bar, ordered by date then start time (nulls last). */
    @Query("""
            SELECT e FROM Event e
            WHERE e.bar = :bar AND e.date >= :from AND e.published = true
            ORDER BY e.date ASC, e.startTime ASC NULLS LAST
            """)
    List<Event> findUpcoming(@Param("bar") BarLocation bar, @Param("from") LocalDate from);

    /** All events for a bar (admin view), newest first. */
    List<Event> findAllByBarOrderByDateDescStartTimeDesc(BarLocation bar);
}
