package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A bar event. Always scoped to one bar; null bar is not used for events.
 * {@code published = false} hides the event from the public site without deleting it.
 */
@Data
@Entity
@Table(name = "event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BarLocation bar;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time")
    private LocalTime startTime;

    /** Free-text price, e.g. "Free", "€5", "TBD". */
    @Column(length = 100)
    private String price;

    /** External sign-up or info link. */
    @Column(name = "subscribe_link", length = 512)
    private String subscribeLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private MediaAsset image;

    @Column(nullable = false)
    private boolean published = true;
}
