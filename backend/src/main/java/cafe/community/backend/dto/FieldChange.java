package cafe.community.backend.dto;

/**
 * A single field-level change captured in an audit entry: the display-friendly
 * field name plus its old and new values rendered as strings. Serialized as a
 * JSON array into the {@code audit_log.changes} column.
 */
public record FieldChange(String field, String oldValue, String newValue) {
}
