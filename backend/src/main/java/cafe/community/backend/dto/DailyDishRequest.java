package cafe.community.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyDishRequest(
        @NotNull LocalDate date,
        @NotBlank @Size(max = 200) String name,
        String description,
        @DecimalMin("0.00") BigDecimal price,
        Long imageId
) {}
