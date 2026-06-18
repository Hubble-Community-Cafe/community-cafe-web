package cafe.community.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record WeeklyHoursRequest(
        @NotNull @Pattern(regexp = "\\d{2}:\\d{2}") String open,
        @NotNull @Pattern(regexp = "\\d{2}:\\d{2}") String close,
        @Pattern(regexp = "\\d{2}:\\d{2}") String kitchenOpen,
        @Pattern(regexp = "\\d{2}:\\d{2}") String kitchenClose
) {}
