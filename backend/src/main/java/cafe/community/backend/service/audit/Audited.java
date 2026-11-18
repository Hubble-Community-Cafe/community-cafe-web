package cafe.community.backend.service.audit;

import cafe.community.backend.model.AuditEntityType;

import java.util.function.Function;

/**
 * How one kind of entity appears in the audit log, for the plain create, update and delete that
 * read "Created vacancy: Barista". Declared once per kind, so every write of it is recorded with
 * the same type, label, fields and wording (see AuditService#created, #updated, #deleted).
 *
 * @param noun     the word in the summary, e.g. "vacancy"
 * @param label    the entry's label, e.g. the vacancy's title
 * @param describe the name in the summary; the label, or the label with a detail like the bar
 */
public record Audited<T>(
        AuditEntityType type,
        String noun,
        Function<T, Long> id,
        Function<T, String> label,
        Function<T, String> describe,
        Function<T, Snapshot> fields) {

    /** A kind whose summary names it by its label. */
    public Audited(AuditEntityType type, String noun, Function<T, Long> id, Function<T, String> label,
                   Function<T, Snapshot> fields) {
        this(type, noun, id, label, label, fields);
    }

    /** Its fields now: take this before a change, and pass it to AuditService#updated. */
    public Snapshot snapshot(T entity) {
        return fields.apply(entity);
    }
}
