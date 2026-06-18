package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A one-off override for a specific calendar date: e.g. a public holiday closure
 * or special extended hours. When {@code closed} is true the bar is shut regardless
 * of its weekly schedule; otherwise {@code open}/{@code close} replace the standing hours.
 */
@Data
@Entity
@Table(name = "hours_override")
public class HoursOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BarLocation bar;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private boolean closed;

    @Column(name = "open_time")
    private LocalTime open;

    @Column(name = "close_time")
    private LocalTime close;

    @Column(length = 255)
    private String note;
}
