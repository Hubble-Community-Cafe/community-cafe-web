package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.HoursOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HoursOverrideRepository extends JpaRepository<HoursOverride, Long> {

    List<HoursOverride> findAllByBarAndDateGreaterThanEqualOrderByDate(BarLocation bar, LocalDate from);

    Optional<HoursOverride> findByBarAndDate(BarLocation bar, LocalDate date);
}
