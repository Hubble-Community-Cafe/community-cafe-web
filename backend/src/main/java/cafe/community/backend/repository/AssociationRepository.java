package cafe.community.backend.repository;

import cafe.community.backend.model.Association;
import cafe.community.backend.model.BarLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssociationRepository extends JpaRepository<Association, Long> {

    @Query("SELECT a FROM Association a WHERE (a.bar = :bar OR a.bar IS NULL) ORDER BY a.name")
    List<Association> findForBar(@Param("bar") BarLocation bar);

    List<Association> findAllByOrderByNameAsc();
}
