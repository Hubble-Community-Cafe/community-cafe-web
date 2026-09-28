package cafe.community.backend.media;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Removes metadata from a WebP without re-encoding it: the EXIF and XMP chunks, with their flags
 * in the VP8X header updated to match. The orientation survives as a minimal EXIF chunk (only in
 * the extended format, the only one where EXIF is allowed). Image data, alpha, animation and ICC
 * profiles are kept. Anything after the RIFF container is dropped.
 */
final class WebpMetadata {

    private static final int FLAG_EXIF = 0x08;
    private static final int FLAG_XMP = 0x04;

    private WebpMetadata() {
    }

    static byte[] strip(byte[] in) {
        long riffSize = Bytes.u32le(in, 4);
        if (riffSize < 4 || riffSize > in.length - 8L) {
            throw ImageSanitizer.unreadable();
        }
        int end = 8 + (int) riffSize;
        ByteArrayOutputStream body = new ByteArrayOutputStream(in.length);
        int vp8xAt = -1;
        boolean orientationWritten = false;
        int p = 12;
        while (p < end) {
            if (p + 8 > end) {
                throw ImageSanitizer.unreadable();
            }
            long size = Bytes.u32le(in, p + 4);
            if (size > end - p - 8L) {
                throw ImageSanitizer.unreadable();
            }
            int dataEnd = p + 8 + (int) size;
            int next = Math.min(end, dataEnd + (int) (size & 1));
            if (Bytes.ascii(in, p, "EXIF")) {
                if (vp8xAt >= 0 && !orientationWritten) {
                    int offset = Bytes.ascii(in, p + 8, "Exif\0\0") ? 6 : 0;
                    int orientation = ExifOrientation.read(in, p + 8 + offset, (int) size - offset);
                    if (orientation > 1) {
                        byte[] tiff = ExifOrientation.tiff(orientation);
                        body.writeBytes("EXIF".getBytes(StandardCharsets.US_ASCII));
                        Bytes.writeU32le(body, tiff.length);
                        body.writeBytes(tiff);
                        orientationWritten = true;
                    }
                }
            } else if (!Bytes.ascii(in, p, "XMP ")) {
                if (Bytes.ascii(in, p, "VP8X")) {
                    vp8xAt = body.size();
                }
                body.write(in, p, next - p);
                if ((size & 1) == 1 && next == dataEnd) {
                    body.write(0); // restore missing padding at the very end
                }
            }
            p = next;
        }
        byte[] chunks = body.toByteArray();
        if (vp8xAt >= 0 && vp8xAt + 8 < chunks.length) {
            int flags = chunks[vp8xAt + 8] & ~(FLAG_EXIF | FLAG_XMP);
            if (orientationWritten) {
                flags |= FLAG_EXIF;
            }
            chunks[vp8xAt + 8] = (byte) flags;
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(chunks.length + 12);
        out.writeBytes("RIFF".getBytes(StandardCharsets.US_ASCII));
        Bytes.writeU32le(out, chunks.length + 4L);
        out.writeBytes("WEBP".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(chunks);
        return out.toByteArray();
    }
}
