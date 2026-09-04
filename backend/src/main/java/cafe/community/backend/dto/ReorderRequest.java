package cafe.community.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * The new order of a list: every id it contains, first to last. Reordering is its own request
 * rather than a field on the update payloads so that dragging a row cannot overwrite fields
 * another editor changed in the meantime, the same reason the visibility toggles are separate.
 */
public record ReorderRequest(@NotEmpty List<Long> orderedIds) {
}
