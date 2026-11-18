package cafe.community.backend.controller;

import cafe.community.backend.aurora.AuroraException;
import cafe.community.backend.service.InvalidFieldException;
import cafe.community.backend.service.MediaInUseException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.unit.DataSize;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** Maps common exceptions to clean JSON error responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${spring.servlet.multipart.max-file-size}")
    private DataSize maxFileSize;

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** A refused value of one form field: the answer names the field, so the form can mark it. */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidField(InvalidFieldException ex) {
        return withField(body(HttpStatus.BAD_REQUEST, ex.getMessage()), ex.field());
    }

    /**
     * Editing or deleting something that no longer exists, for example a stale admin tab after a
     * colleague deleted the event. That is a 404, not a server error for Sentry.
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Aurora being unreachable or refusing a call is an upstream failure, not a bug in us, so it
     * reports as 502 with Aurora's own message rather than a bare 500.
     */
    @ExceptionHandler(AuroraException.class)
    public ResponseEntity<Map<String, Object>> handleAurora(AuroraException ex) {
        return body(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }

    /** Deleting something still in use, e.g. an image an event shows: the message says what uses it. */
    @ExceptionHandler(MediaInUseException.class)
    public ResponseEntity<Map<String, Object>> handleInUse(MediaInUseException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage());
    }

    /** An unparseable path variable, for example an unknown scene name. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for " + ex.getName());
    }

    /**
     * An upload over the multipart limit. Spring already answers 413, but with an empty message,
     * so clients have nothing to show the user. Spell out the limit instead.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        return body(HttpStatus.PAYLOAD_TOO_LARGE,
                "That file is too large. The maximum upload size is " + maxFileSize.toMegabytes() + " MB.");
    }

    /**
     * The first broken field, named the way the form labels it, since staff and visitors read this.
     * {@code field} carries its request name too, so the form can mark it.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        var first = ex.getBindingResult().getFieldErrors().stream().findFirst();
        String message = first
                .map(e -> FieldLabels.of(e.getField()) + " " + e.getDefaultMessage())
                .orElse("Validation failed");
        ResponseEntity<Map<String, Object>> response = body(HttpStatus.BAD_REQUEST, message);
        return first.map(e -> withField(response, e.getField())).orElse(response);
    }

    private static ResponseEntity<Map<String, Object>> withField(ResponseEntity<Map<String, Object>> response,
                                                                 String field) {
        Map<String, Object> body = new LinkedHashMap<>(response.getBody());
        body.put("field", field);
        return ResponseEntity.status(response.getStatusCode()).body(body);
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message == null ? "" : message));
    }
}
