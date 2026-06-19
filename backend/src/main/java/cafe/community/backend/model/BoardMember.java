package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "board_member")
public class BoardMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "term_id", nullable = false)
    private BoardTerm term;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id")
    private MediaAsset photo;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
