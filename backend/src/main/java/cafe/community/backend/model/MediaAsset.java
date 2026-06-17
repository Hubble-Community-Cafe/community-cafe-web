package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Metadata for an uploaded image (event/board/menu photo). The bytes are stored
 * by the upload pipeline added in a later milestone; this skeleton holds the
 * record and serving URL. A {@code null} bar means the asset is shared.
 */
@Data
@Entity
@Table(name = "media_asset")
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "filename", nullable = false, length = 255)
    private String filename;

    @Column(name = "content_type", length = 100)
    private String contentType;

    /** Public URL the frontends use to render the image. */
    @Column(name = "url", nullable = false, length = 512)
    private String url;

    @Column(name = "alt", length = 255)
    private String alt;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    /** The bar this asset belongs to, or null when shared. */
    @Enumerated(EnumType.STRING)
    @Column(name = "bar", length = 20)
    private BarLocation bar;

    /** Azure OID of the uploader, if known. */
    @Column(name = "uploaded_by_oid", length = 255)
    private String uploadedByOid;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
