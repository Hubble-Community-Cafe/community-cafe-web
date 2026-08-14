package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    List<MenuCategory> findAllByOrderBySortOrderAsc();

    /**
     * Delete sub-categories (those with a parent) first. {@code menu_category} has a
     * self-referential FK ({@code parent_id}), so a single bulk delete of all rows fails
     * under strict engines like MariaDB; removing the children first makes it safe.
     */
    @Modifying
    @Query("DELETE FROM MenuCategory c WHERE c.parent IS NOT NULL")
    void deleteSubcategories();

    /** Top-level tab categories for a given bar (parent IS NULL), hidden ones included. */
    @Query("SELECT c FROM MenuCategory c WHERE (c.bar = :bar OR c.bar IS NULL) AND c.parent IS NULL ORDER BY c.sortOrder ASC")
    List<MenuCategory> findTopLevelForBar(@Param("bar") BarLocation bar);

    /** As {@link #findTopLevelForBar} but only tabs shown on the public site. */
    @Query("SELECT c FROM MenuCategory c WHERE (c.bar = :bar OR c.bar IS NULL) AND c.parent IS NULL AND c.active = true ORDER BY c.sortOrder ASC")
    List<MenuCategory> findActiveTopLevelForBar(@Param("bar") BarLocation bar);

    /** Sub-heading categories that belong to a given tab, in sort order. */
    List<MenuCategory> findByParentOrderBySortOrderAsc(MenuCategory parent);

    /** Sub-heading categories of a tab filtered by visibility, in sort order. */
    List<MenuCategory> findByParentAndActiveOrderBySortOrderAsc(MenuCategory parent, boolean active);
}
