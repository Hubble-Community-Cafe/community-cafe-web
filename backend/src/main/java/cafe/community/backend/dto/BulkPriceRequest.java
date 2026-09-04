package cafe.community.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Set the same price on several menu items at once, the case the per-item form makes tedious when
 * a whole section shares a price.
 *
 * <p>A null price means "leave this one alone", so the regular price can be changed without
 * touching the student price. That leaves no way to express "remove the student price", hence
 * {@code clearStudentPrice}; sending it together with a student price is contradictory and is
 * rejected rather than silently resolved.
 *
 * <p>The id list is capped so one request cannot rewrite the whole menu in a single transaction.
 */
public record BulkPriceRequest(
        @NotEmpty @Size(max = 200) List<Long> ids,
        @DecimalMin("0.00") BigDecimal regularPrice,
        @DecimalMin("0.00") BigDecimal studentPrice,
        /**
         * Null means "no", like {@link MenuCategoryRequest#active()}. It is boxed on purpose: a
         * primitive boolean here makes Jackson reject any payload that omits the flag, which is
         * every ordinary price change.
         */
        Boolean clearStudentPrice
) {

    /** The flag as a plain yes or no, with the absent case folded in. */
    public boolean shouldClearStudentPrice() {
        return Boolean.TRUE.equals(clearStudentPrice);
    }
}
