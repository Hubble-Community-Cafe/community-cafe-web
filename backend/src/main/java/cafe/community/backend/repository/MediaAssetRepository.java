package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {

    List<MediaAsset> findAllByOrderByCreatedAtDesc();

    List<MediaAsset> findByBarOrderByCreatedAtDesc(BarLocation bar);

    // What still uses an image, one query per table with a foreign key to media_asset, returning
    // the name staff know it by. Used to refuse deleting an image that is in use (MediaService).

    @Query("SELECT e.title FROM Event e WHERE e.image.id = :id ORDER BY e.date")
    List<String> eventsUsing(@Param("id") Long id);

    @Query("SELECT m.name FROM MenuItem m WHERE m.image.id = :id ORDER BY m.name")
    List<String> menuItemsUsing(@Param("id") Long id);

    @Query("SELECT d.name FROM DailyDish d WHERE d.image.id = :id ORDER BY d.date")
    List<String> dailyDishesUsing(@Param("id") Long id);

    @Query("SELECT b.name FROM BoardMember b WHERE b.photo.id = :id ORDER BY b.name")
    List<String> boardMembersUsing(@Param("id") Long id);

    @Query("SELECT t.label FROM BoardTerm t WHERE t.groupPhoto.id = :id ORDER BY t.label")
    List<String> boardTermsUsing(@Param("id") Long id);

    @Query("SELECT v.title FROM Vacancy v WHERE v.image.id = :id ORDER BY v.title")
    List<String> vacanciesUsing(@Param("id") Long id);

    @Query("SELECT a.name FROM Association a WHERE a.logo.id = :id ORDER BY a.name")
    List<String> associationsUsing(@Param("id") Long id);
}
