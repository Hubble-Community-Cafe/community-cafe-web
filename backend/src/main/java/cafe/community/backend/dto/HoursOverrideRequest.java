package cafe.community.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record HoursOverrideRequest(
        @NotNull LocalDate date,
        @NotNull Boolean closed,
        @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String open,
        @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String close,
        String note
) {}
