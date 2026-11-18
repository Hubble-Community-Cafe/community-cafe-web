package cafe.community.backend.repository;

import cafe.community.backend.model.DailyDish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DailyDishRepository extends JpaRepository<DailyDish, Long> {

    List<DailyDish> findAllByDateOrderByIdAsc(LocalDate date);

    List<DailyDish> findByDateGreaterThanEqualOrderByDateAsc(LocalDate from);
}
