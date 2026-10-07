package cafe.community.backend.aurora;

/**
 * Aurora answered, but refused the content of a request (400, 413 or 415). Unlike a plain
 * {@link AuroraException} this is not an outage: sending the same request again fails again, so
 * callers report it to whoever sent it instead of falling back.
 */
public class AuroraRejectedException extends AuroraException {

    /** Why Aurora refused the request, from its status code. */
    public enum Reason {
        /** 400: a field failed Aurora's validation. */
        INVALID,
        /** 413: the file is over 20 MB, or the image is over 40 megapixels. */
        TOO_LARGE,
        /** 415: the file is not a JPG, PNG or MP4, or it is damaged. */
        UNSUPPORTED_FILE
    }

    private final Reason reason;

    public AuroraRejectedException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public Reason reason() {
        return reason;
    }
}
