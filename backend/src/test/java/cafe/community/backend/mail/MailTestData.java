package cafe.community.backend.mail;

import java.util.List;

/** Form emails as FormService builds them, with a visitor's name and address that must never be logged. */
final class MailTestData {

    static final String VISITOR_EMAIL = "jane.visitor@example.com";
    static final String VISITOR_NAME = "Jane Visitor";

    private MailTestData() {
    }

    /** The staff notification: to the team list, reply-to the visitor, with the uploaded file. */
    static FormEmail staffNotification() {
        return new FormEmail("noreply@hubble.cafe", "screens@hubble.cafe", "board@hubble.cafe", VISITOR_EMAIL,
                "Screen Request from " + VISITOR_NAME + " - Inter Actief",
                "Screen Request from " + VISITOR_NAME + "\n\nPlease show our poster.",
                List.of(new FormEmail.Attachment("poster.png", "image/png", new byte[]{1, 2, 3, 4})));
    }

    /** The submitter confirmation: to the visitor, no attachment. */
    static FormEmail submitterConfirmation() {
        return new FormEmail("noreply@meteor.cafe", VISITOR_EMAIL, null, "noreply@meteor.cafe",
                "We received your complaint", "Hi " + VISITOR_NAME + ",\n\nThanks for your message.", List.of());
    }
}
