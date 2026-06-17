package cafe.community.backend.controller;

import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.MediaAssetRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read access to the media library. Upload/storage of bytes arrives with the
 * first image-bearing CMS module; this skeleton exposes the catalogue.
 */
@RestController
@RequestMapping("/api/admin/media")
public class MediaAssetController {

    private final MediaAssetRepository mediaAssetRepository;

    public MediaAssetController(MediaAssetRepository mediaAssetRepository) {
        this.mediaAssetRepository = mediaAssetRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('EDITOR')")
    public List<MediaAsset> list() {
        return mediaAssetRepository.findAll();
    }
}
