package cafe.community.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record HoursOverrideRequest(
        @NotNull LocalDate date,
        @NotNull Boolean closed,
        @Pattern(regexp = "\\d{2}:\\d{2}") String open,
        @Pattern(regexp = "\\d{2}:\\d{2}") String close,
        String note
) {}
