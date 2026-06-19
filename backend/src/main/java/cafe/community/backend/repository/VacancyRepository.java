package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VacancyRepository extends JpaRepository<Vacancy, Long> {

    @Query("SELECT v FROM Vacancy v WHERE (v.bar = :bar OR v.bar IS NULL) AND v.active = true ORDER BY v.sortOrder, v.title")
    List<Vacancy> findActiveForBar(@Param("bar") BarLocation bar);

    List<Vacancy> findAllByOrderBySortOrderAscTitleAsc();
}
