package cafe.community.backend.service.audit;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * The fields of one entity as the audit log shows them: a readable name per field and its value
 * as text, in a fixed order. Take one before and one after a change to get exactly what changed;
 * on create or delete the whole snapshot is kept, so the log shows what was added or removed.
 *
 * <p>Values are formatted once here, so every module reads the same: prices at two decimals,
 * yes/no for switches, the file name for images, options as words and "Both" for shared content. Empty text counts
 * as no value, so clearing a field and leaving it blank read the same.
 */
public final class Snapshot {

    private final Map<String, String> values = new LinkedHashMap<>();

    public Snapshot text(String field, String value) {
        values.put(field, value == null || value.isBlank() ? null : value);
        return this;
    }

    public Snapshot value(String field, Object value) {
        return text(field, value == null ? null : value.toString());
    }

    public Snapshot money(String field, BigDecimal value) {
        return text(field, value == null ? null : value.setScale(2, RoundingMode.HALF_UP).toPlainString());
    }

    public Snapshot yesNo(String field, boolean value) {
        return text(field, value ? "Yes" : "No");
    }

    public Snapshot bar(String field, BarLocation bar) {
        return text(field, bar == null ? "Both" : bar == BarLocation.HUBBLE ? "Hubble" : "Meteor");
    }

    /** An option such as {@code SUPERVISORY}, as "Supervisory". */
    public Snapshot choice(String field, Enum<?> value) {
        if (value == null) return text(field, null);
        String words = value.name().toLowerCase().replace('_', ' ');
        return text(field, Character.toUpperCase(words.charAt(0)) + words.substring(1));
    }

    public Snapshot image(String field, MediaAsset image) {
        return text(field, image == null ? null : image.getFilename());
    }

    /** The fields that differ in {@code after}, as old to new. Empty when nothing changed. */
    public List<FieldChange> changesTo(Snapshot after) {
        List<FieldChange> changes = new ArrayList<>();
        after.values.forEach((field, newValue) -> {
            String oldValue = values.get(field);
            if (!Objects.equals(oldValue, newValue)) {
                changes.add(new FieldChange(field, oldValue, newValue));
            }
        });
        return changes;
    }

    /** Every field that has a value, as added (no old value). */
    public List<FieldChange> asCreated() {
        List<FieldChange> fields = new ArrayList<>();
        values.forEach((field, value) -> {
            if (value != null) fields.add(new FieldChange(field, null, value));
        });
        return fields;
    }

    /** Every field that had a value, as removed (no new value). */
    public List<FieldChange> asDeleted() {
        List<FieldChange> fields = new ArrayList<>();
        values.forEach((field, value) -> {
            if (value != null) fields.add(new FieldChange(field, value, null));
        });
        return fields;
    }
}
