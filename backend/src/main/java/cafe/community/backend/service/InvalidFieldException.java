package cafe.community.backend.service;

/**
 * A refused value that belongs to one form field, so the form can mark that field as well as show
 * the message. Still an {@link IllegalArgumentException}: everything that handles those keeps working.
 */
public class InvalidFieldException extends IllegalArgumentException {

    private final String field;

    /** {@code field} is the request's own name for it, the one the form posts, e.g. "dateOfPurchase". */
    public InvalidFieldException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String field() {
        return field;
    }
}
