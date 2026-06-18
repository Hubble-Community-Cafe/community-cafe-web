package cafe.community.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EventRequest(
        @NotBlank String bar,
        @NotBlank String title,
        String description,
        @NotNull LocalDate date,
        String startTime,
        String price,
        String subscribeLink,
        Long imageId,
        boolean published
) {}
