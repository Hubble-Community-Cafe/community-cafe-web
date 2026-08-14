package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * A named group of menu items (e.g. "Beers", "Hot food").
 * A null {@code bar} means the category appears on both sites.
 */
@Data
@Entity
@Table(name = "menu_category")
public class MenuCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MenuKind kind;

    /** Free-text note, e.g. "available after 17:00". Displayed under the category heading. */
    @Column(name = "availability_note", length = 255)
    private String availabilityNote;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** The bar this category belongs to, or null when shared across both sites. */
    @Enumerated(EnumType.STRING)
    @Column(name = "bar", length = 20)
    private BarLocation bar;

    /**
     * Parent tab category. Null means this IS a tab (top-level navigation item).
     * Non-null means this is a sub-heading within a tab; only sub-headings hold items.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MenuCategory parent;

    /**
     * Whether this category is shown on the public site. Hiding a category also hides
     * everything under it (sub-headings and items) without touching their own flags, so
     * re-enabling it restores exactly what was visible before.
     */
    @Column(nullable = false)
    private boolean active = true;
}
