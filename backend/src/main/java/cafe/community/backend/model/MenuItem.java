package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * A single item on the menu. Prices are stored as exact decimals.
 * List-like fields (sizeOptions, dietaryTags, allergens) are stored as
 * comma-separated strings; an empty string means an empty list.
 */
@Data
@Entity
@Table(name = "menu_item")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private MenuCategory category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "regular_price", nullable = false, precision = 6, scale = 2)
    private BigDecimal regularPrice;

    /** TU/e student price for dual pricing; null when not applicable. */
    @Column(name = "student_price", precision = 6, scale = 2)
    private BigDecimal studentPrice;

    /** Comma-separated size options, e.g. "0.25L,0.5L". Empty string means none. */
    @Column(name = "size_options", length = 255)
    private String sizeOptions = "";

    /** Comma-separated dietary tags, e.g. "vegan,gluten-free". */
    @Column(name = "dietary_tags", length = 255)
    private String dietaryTags = "";

    /** Comma-separated allergen names. */
    @Column(name = "allergens", length = 255)
    private String allergens = "";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private MediaAsset image;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;
}
