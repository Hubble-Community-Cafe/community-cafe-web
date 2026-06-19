package cafe.community.backend.service;

import cafe.community.backend.dto.MediaAssetDto;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.MediaAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png",  "png",
            "image/webp", "webp",
            "image/gif",  "gif"
    );

    @Value("${app.media-dir}")
    private String mediaDir;

    @Value("${app.media-base-url}")
    private String mediaBaseUrl;

    private final MediaAssetRepository repo;
    private final AuditService auditService;

    public MediaService(MediaAssetRepository repo, AuditService auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MediaAssetDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(MediaAssetDto::from).toList();
    }

    public MediaAssetDto upload(MultipartFile file, String alt, BarLocation bar) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType
                    + ". Allowed: JPEG, PNG, WebP, GIF.");
        }

        String ext = EXTENSIONS.get(contentType);
        String filename = UUID.randomUUID() + "." + ext;
        Path dir = Paths.get(mediaDir);

        try {
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(filename));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }

        MediaAsset asset = new MediaAsset();
        asset.setFilename(filename);
        asset.setContentType(contentType);
        asset.setUrl(mediaBaseUrl + "/media/" + filename);
        asset.setAlt(alt);
        asset.setSizeBytes(file.getSize());
        asset.setBar(bar);

        MediaAsset saved = repo.save(asset);
        auditService.recordCreate(AuditEntityType.MEDIA_ASSET, saved.getId(), filename,
                List.of(), "Uploaded image: " + filename
                        + (bar != null ? " (" + bar.name() + ")" : ""));
        return MediaAssetDto.from(saved);
    }

    public void delete(Long id) {
        MediaAsset asset = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Media asset not found: " + id));
        try {
            Files.deleteIfExists(Paths.get(mediaDir, asset.getFilename()));
        } catch (IOException e) {
            log.warn("Could not delete media file: {}", asset.getFilename(), e);
        }
        repo.deleteById(id);
        auditService.recordDelete(AuditEntityType.MEDIA_ASSET, id, asset.getFilename(),
                "Deleted image: " + asset.getFilename());
    }
}
