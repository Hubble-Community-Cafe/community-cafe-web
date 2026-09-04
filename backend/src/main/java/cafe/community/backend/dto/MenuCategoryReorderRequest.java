package cafe.community.backend.dto;

import cafe.community.backend.model.BarLocation;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * The new order of one level of the menu tree. With a {@code parentId} it reorders that tab's
 * sub-headings; without one it reorders the top-level tabs of {@code bar}, which is then required.
 *
 * <p>A tab with no bar shows in both bars' lists but has a single sort order, so reordering the
 * tabs of one bar also moves such a shared tab in the other bar's list.
 */
public record MenuCategoryReorderRequest(
        Long parentId,
        BarLocation bar,
        @NotEmpty List<Long> orderedIds
) {
}
