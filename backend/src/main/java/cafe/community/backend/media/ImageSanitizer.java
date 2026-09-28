package cafe.community.backend.media;

import java.util.Arrays;
import java.util.Map;

/**
 * Checks that an upload really is the image type it claims to be, from its magic bytes rather than
 * the browser-supplied content type, and removes its metadata (EXIF with GPS position, camera and
 * timestamps, XMP, IPTC, comments) without re-encoding. Images are public, so a phone photo would
 * otherwise reveal where it was taken. The orientation is kept, so portraits stay upright.
 */
public final class ImageSanitizer {

    private static final Map<String, String> NAMES = Map.of(
            "image/jpeg", "JPEG",
            "image/png", "PNG",
            "image/webp", "WebP",
            "image/gif", "GIF"
    );

    /** The detected content type and the image bytes with metadata removed. */
    public record SanitizedImage(String contentType, byte[] bytes) {
    }

    private ImageSanitizer() {
    }

    /**
     * @param declaredType the content type the client sent, already checked against the allowed types
     * @throws IllegalArgumentException with a message for staff when the file is not a readable image
     *                                  of the declared type
     */
    public static SanitizedImage sanitize(byte[] data, String declaredType) {
        String actual = detect(data);
        if (actual == null) {
            throw new IllegalArgumentException(
                    "This file is not a JPEG, PNG, WebP or GIF image. Please choose a photo or image file.");
        }
        if (!actual.equals(declaredType)) {
            throw new IllegalArgumentException("This file is named as a " + NAMES.getOrDefault(declaredType, "image")
                    + " but is really a " + NAMES.get(actual) + ". Please save it again as "
                    + NAMES.get(actual) + " (with the matching file extension) and upload that.");
        }
        try {
            byte[] stripped = switch (actual) {
                case "image/jpeg" -> JpegMetadata.strip(data);
                case "image/png" -> PngMetadata.strip(data);
                case "image/webp" -> WebpMetadata.strip(data);
                default -> GifMetadata.strip(data);
            };
            return new SanitizedImage(actual, stripped);
        } catch (IndexOutOfBoundsException e) {
            throw unreadable();
        }
    }

    /** The content type from the file's magic bytes, or null when it is none of the allowed types. */
    static String detect(byte[] b) {
        if (b.length >= 3 && Bytes.u8(b, 0) == 0xFF && Bytes.u8(b, 1) == 0xD8 && Bytes.u8(b, 2) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && Arrays.equals(b, 0, 8, PngMetadata.SIGNATURE, 0, 8)) {
            return "image/png";
        }
        if (Bytes.ascii(b, 0, "GIF87a") || Bytes.ascii(b, 0, "GIF89a")) {
            return "image/gif";
        }
        if (b.length >= 12 && Bytes.ascii(b, 0, "RIFF") && Bytes.ascii(b, 8, "WEBP")) {
            return "image/webp";
        }
        return null;
    }

    static IllegalArgumentException unreadable() {
        return new IllegalArgumentException(
                "This image could not be read, it may be damaged or incomplete. "
                        + "Please open it, save it again and upload the new file.");
    }
}
