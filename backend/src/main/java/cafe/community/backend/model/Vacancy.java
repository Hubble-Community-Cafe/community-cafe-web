package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "vacancy")
public class Vacancy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Free-text hours commitment, e.g. "10-15 hrs/week". */
    @Column(length = 100)
    private String hours;

    /** Free-text employment type, e.g. "Paid", "Volunteer". */
    @Column(length = 100)
    private String type;

    @Column(name = "apply_email", length = 200)
    private String applyEmail;

    @Column(name = "apply_link", length = 512)
    private String applyLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private MediaAsset image;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BarLocation bar;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
