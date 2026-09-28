package cafe.community.backend.service;

/** An image cannot be deleted because content still shows it. Answered with 409 and the message. */
public class MediaInUseException extends RuntimeException {

    public MediaInUseException(String message) {
        super(message);
    }
}
