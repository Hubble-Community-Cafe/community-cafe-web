package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    List<MenuCategory> findAllByOrderBySortOrderAsc();

    /** Categories visible to a given bar: bar-specific plus shared (bar IS NULL). */
    @Query("SELECT c FROM MenuCategory c WHERE c.bar = :bar OR c.bar IS NULL ORDER BY c.sortOrder ASC")
    List<MenuCategory> findForBar(@Param("bar") BarLocation bar);
}
