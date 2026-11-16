package cafe.community.backend.service;

import cafe.community.backend.mail.FormEmail;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

/**
 * Checks a file uploaded through a public form before it is mailed to staff or sent to Aurora.
 * The type comes from the file's own bytes, never from the browser's declared content type or
 * the visitor's file name: both are visitor-controlled, so an HTML page declared as a PDF and
 * named {@code receipt.pdf.html} would otherwise reach a staff mailbox from our own sender. The
 * attachment is renamed server-side to {@code <baseName>.<extension of the detected type>}.
 */
final class FormAttachments {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "application/pdf", "pdf",
            "image/jpeg", "jpg",
            "image/png", "png",
            "video/mp4", "mp4");
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] PDF_HEADER = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] MP4_FTYP = "ftyp".getBytes(StandardCharsets.US_ASCII);
    /** PDF readers accept the header anywhere in the first 1024 bytes, so this does too. */
    private static final int PDF_HEADER_WINDOW = 1024;

    private FormAttachments() {
    }

    /**
     * The uploaded file as an attachment, or an {@link IllegalArgumentException} with a message
     * for the visitor when it is missing, too large or not one of {@code allowedTypes}.
     */
    static FormEmail.Attachment require(MultipartFile file, Set<String> allowedTypes, String what,
                                        long maxBytes, String baseName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please attach " + what + ".");
        }
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    "The file is too large (max " + maxBytes / (1024 * 1024) + " MB).");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the uploaded file.");
        }
        String type = detect(data);
        if (type == null || !allowedTypes.contains(type)) {
            throw new IllegalArgumentException("Unsupported file type. Please upload " + what + ".");
        }
        return new FormEmail.Attachment(baseName + "." + EXTENSIONS.get(type), type, data);
    }

    /** The content type from the file's magic bytes, or null when it is none of the known types. */
    static String detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (startsWith(b, 0, PNG_SIGNATURE)) {
            return "image/png";
        }
        // An ISO base media file starts with a box whose type, at offset 4, is "ftyp".
        if (startsWith(b, 4, MP4_FTYP)) {
            return "video/mp4";
        }
        int window = Math.min(b.length, PDF_HEADER_WINDOW);
        for (int i = 0; i + PDF_HEADER.length <= window; i++) {
            if (startsWith(b, i, PDF_HEADER)) {
                return "application/pdf";
            }
        }
        return null;
    }

    private static boolean startsWith(byte[] b, int offset, byte[] prefix) {
        if (b.length < offset + prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (b[offset + i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
