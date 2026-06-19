package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * A board term (executive or supervisory). The current executive board has
 * {@code bar = null} (shared). Previous executive boards are scoped per bar.
 * The supervisory board is a separate type, also scoped to Hubble.
 */
@Data
@Entity
@Table(name = "board_term")
public class BoardTerm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BoardType type;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BarLocation bar;

    @Column(name = "is_current", nullable = false)
    private boolean current = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** Group photo shown on the previous-boards page for this term. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_photo_id")
    private MediaAsset groupPhoto;

    /** Credit line shown below the photos, e.g. "Photos by Jane Doe / Studio X". */
    @Column(name = "photo_credit", length = 300)
    private String photoCredit;

    @OneToMany(mappedBy = "term", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<BoardMember> members = new ArrayList<>();
}
