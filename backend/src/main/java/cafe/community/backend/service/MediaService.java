package cafe.community.backend.service;

import cafe.community.backend.dto.MediaAssetDto;
import cafe.community.backend.media.ImageSanitizer;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.MediaAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
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

        // Verify the real type and strip EXIF/XMP (GPS position, camera, timestamps) before the
        // image is stored, since everything in the media folder is served publicly.
        ImageSanitizer.SanitizedImage image;
        try {
            image = ImageSanitizer.sanitize(file.getBytes(), contentType);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }

        String ext = EXTENSIONS.get(image.contentType());
        String filename = UUID.randomUUID() + "." + ext;
        Path dir = Paths.get(mediaDir);

        try {
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), image.bytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }

        MediaAsset asset = new MediaAsset();
        asset.setFilename(filename);
        asset.setContentType(image.contentType());
        asset.setUrl(mediaBaseUrl + "/media/" + filename);
        asset.setAlt(alt);
        asset.setSizeBytes((long) image.bytes().length);
        asset.setBar(bar);

        MediaAsset saved = repo.save(asset);
        auditService.recordCreate(AuditEntityType.MEDIA_ASSET, saved.getId(), filename,
                List.of(), "Uploaded image: " + filename
                        + (bar != null ? " (" + bar.name() + ")" : ""));
        return MediaAssetDto.from(saved);
    }

    /**
     * Delete an image, but only when nothing shows it any more: an image still used by an event,
     * menu item, board member and so on is refused with a message naming what uses it. The row is
     * deleted first and the file only after the transaction commits, so a failed or rolled-back
     * delete never leaves content pointing at a file that is gone.
     */
    public void delete(Long id) {
        MediaAsset asset = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Media asset not found: " + id));

        List<String> usages = usagesOf(id);
        if (!usages.isEmpty()) {
            throw new MediaInUseException(inUseMessage(usages));
        }

        try {
            repo.delete(asset);
            repo.flush(); // surface a foreign-key failure here, not at commit
        } catch (DataIntegrityViolationException e) {
            // Someone chose this image between the check above and the delete.
            throw new MediaInUseException(
                    "This image was just chosen for something else, so it cannot be deleted.");
        }
        auditService.recordDelete(AuditEntityType.MEDIA_ASSET, id, asset.getFilename(),
                "Deleted image: " + asset.getFilename());
        deleteFileAfterCommit(asset.getFilename());
    }

    /** Human descriptions of what still uses an image, e.g. "the event 'Pub quiz'". */
    List<String> usagesOf(Long id) {
        List<String> usages = new ArrayList<>();
        repo.eventsUsing(id).forEach(n -> usages.add("the event '" + n + "'"));
        repo.menuItemsUsing(id).forEach(n -> usages.add("the menu item '" + n + "'"));
        repo.dailyDishesUsing(id).forEach(n -> usages.add("the daily dish '" + n + "'"));
        repo.boardMembersUsing(id).forEach(n -> usages.add("the board member '" + n + "'"));
        repo.boardTermsUsing(id).forEach(n -> usages.add("the group photo of '" + n + "'"));
        repo.vacanciesUsing(id).forEach(n -> usages.add("the vacancy '" + n + "'"));
        repo.associationsUsing(id).forEach(n -> usages.add("the logo of '" + n + "'"));
        return usages;
    }

    static String inUseMessage(List<String> usages) {
        List<String> shown = usages.size() > 3 ? usages.subList(0, 3) : usages;
        String list = shown.size() == 1 ? shown.get(0)
                : String.join(", ", shown.subList(0, shown.size() - 1)) + " and " + shown.get(shown.size() - 1);
        if (usages.size() > 3) {
            list = String.join(", ", shown) + " and " + (usages.size() - 3) + " more";
        }
        return "This image is still used by " + list + ". Choose another image there first.";
    }

    /**
     * Remove the file once the row is gone for good. Without a transaction (unit tests) the row
     * delete has already happened, so the file goes straight away.
     */
    private void deleteFileAfterCommit(String filename) {
        Runnable removeFile = () -> {
            try {
                Files.deleteIfExists(Paths.get(mediaDir, filename));
            } catch (IOException e) {
                log.warn("Could not delete media file: {}", filename, e);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    removeFile.run();
                }
            });
        } else {
            removeFile.run();
        }
    }
}
