package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.OpeningHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface OpeningHoursRepository extends JpaRepository<OpeningHours, Long> {

    List<OpeningHours> findAllByBarOrderByDayOfWeek(BarLocation bar);

    Optional<OpeningHours> findByBarAndDayOfWeek(BarLocation bar, DayOfWeek dayOfWeek);

    boolean existsByBarAndDayOfWeek(BarLocation bar, DayOfWeek dayOfWeek);
}
