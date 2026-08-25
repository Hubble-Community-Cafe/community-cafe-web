package cafe.community.backend.aurora;

/**
 * Raised when a call to the Aurora narrowcasting API fails: a transport error, a timeout,
 * or a non-2xx response. Callers surface this to the admin rather than letting it become a
 * bare 500, because Aurora being down is a normal operational state for us.
 */
public class AuroraException extends RuntimeException {

    public AuroraException(String message) {
        super(message);
    }

    public AuroraException(String message, Throwable cause) {
        super(message, cause);
    }
}
