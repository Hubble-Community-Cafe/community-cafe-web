package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Standing weekly hours for one bar on one day of the week.
 * A day that has no row is considered closed for that bar.
 */
@Data
@Entity
@Table(
    name = "opening_hours",
    uniqueConstraints = @UniqueConstraint(columnNames = {"bar", "day_of_week"})
)
public class OpeningHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BarLocation bar;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    private DayOfWeek dayOfWeek;

    @Column(name = "open_time", nullable = false)
    private LocalTime open;

    @Column(name = "close_time", nullable = false)
    private LocalTime close;

    @Column(name = "kitchen_open")
    private LocalTime kitchenOpen;

    @Column(name = "kitchen_close")
    private LocalTime kitchenClose;
}
