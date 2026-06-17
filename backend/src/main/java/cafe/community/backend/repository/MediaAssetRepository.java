package cafe.community.backend.repository;

import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {

    List<MediaAsset> findByBarOrderByCreatedAtDesc(BarLocation bar);
}
