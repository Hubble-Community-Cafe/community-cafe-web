package cafe.community.backend.mail;

import java.util.List;

/**
 * A staff-notification email generated from a public form submission: a plain-text body
 * with optional file attachments, sent to a per-form recipient with the submitter set as
 * reply-to so staff can answer directly.
 */
public record FormEmail(
        String from,
        String to,
        String cc,
        String replyTo,
        String subject,
        String body,
        List<Attachment> attachments
) {
    /** An in-memory file attachment (the uploaded poster/receipt); never persisted to disk. */
    public record Attachment(String filename, String contentType, byte[] data) {}
}
