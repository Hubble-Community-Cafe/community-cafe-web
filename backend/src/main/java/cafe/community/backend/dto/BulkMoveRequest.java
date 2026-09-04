package cafe.community.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Move several menu items into another sub-heading. Also the only way to move a single mis-filed
 * item: the item form has no category selector, so before this the only fix was delete and
 * re-create.
 */
public record BulkMoveRequest(
        @NotEmpty @Size(max = 200) List<Long> ids,
        @NotNull Long categoryId
) {
}
