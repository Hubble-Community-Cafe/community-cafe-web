package cafe.community.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record WeeklyHoursRequest(
        @NotNull @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String open,
        @NotNull @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String close,
        @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String kitchenOpen,
        @Pattern(regexp = TimeOfDay.HH_MM, message = TimeOfDay.MESSAGE) String kitchenClose
) {}
