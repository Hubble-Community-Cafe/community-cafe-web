package cafe.community.backend.util;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

/** Shared logic for the reorder endpoints: turn a list of ids into a gap-free sort order. */
public final class SortOrders {

    private SortOrders() {
    }

    /**
     * Number the given rows 0..n-1 in the order their ids are named.
     *
     * <p>The ids must be exactly the rows being reordered. A payload that omits a row, names an
     * unknown one, or repeats one is rejected rather than partially applied, so an admin tab left
     * open while someone else adds or deletes an entry cannot silently drop it. Rewriting the whole
     * range also normalises the gaps and duplicate numbers the old free-form sort-order field
     * allowed.
     *
     * @throws IllegalArgumentException if the ids do not match the rows one to one
     */
    public static <T> void apply(List<T> rows, List<Long> orderedIds,
                                 Function<T, Long> idOf, BiConsumer<T, Integer> setSortOrder) {
        Map<Long, T> byId = new LinkedHashMap<>();
        for (T row : rows) {
            byId.put(idOf.apply(row), row);
        }
        boolean matches = orderedIds.size() == byId.size()
                && new HashSet<>(orderedIds).size() == orderedIds.size()
                && byId.keySet().containsAll(orderedIds);
        if (!matches) {
            throw new IllegalArgumentException(
                    "The submitted order does not match this list. Reload the page and try again.");
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            setSortOrder.accept(byId.get(orderedIds.get(i)), i);
        }
    }
}
