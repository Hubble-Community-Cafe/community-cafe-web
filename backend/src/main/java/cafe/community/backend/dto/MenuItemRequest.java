package cafe.community.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        @NotNull @DecimalMin("0.00") BigDecimal regularPrice,
        @DecimalMin("0.00") BigDecimal studentPrice,
        List<String> sizeOptions,
        List<String> dietaryTags,
        List<String> allergens,
        Long imageId,
        int sortOrder,
        boolean active
) {}
