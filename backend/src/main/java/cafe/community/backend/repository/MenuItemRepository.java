package cafe.community.backend.repository;

import cafe.community.backend.model.MenuCategory;
import cafe.community.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByCategoryOrderBySortOrderAsc(MenuCategory category);

    List<MenuItem> findByCategoryAndActiveOrderBySortOrderAsc(MenuCategory category, boolean active);

    List<MenuItem> findByCategoryIdOrderBySortOrderAsc(Long categoryId);
}
