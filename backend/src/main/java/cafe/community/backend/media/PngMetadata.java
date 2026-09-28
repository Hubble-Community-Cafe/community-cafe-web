package cafe.community.backend.media;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.zip.CRC32;

/**
 * Removes metadata from a PNG without re-encoding it: text chunks (which carry XMP too), the
 * modification time and EXIF. The orientation survives as a minimal eXIf chunk in place of the
 * original. Colour chunks (iCCP, sRGB, gAMA, cHRM), pixel density and APNG animation are kept.
 * Stops at IEND, so appended data is dropped.
 */
final class PngMetadata {

    static final byte[] SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    private static final Set<String> DROPPED = Set.of("tEXt", "zTXt", "iTXt", "tIME", "eXIf");

    private PngMetadata() {
    }

    static byte[] strip(byte[] in) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(in.length);
        out.write(in, 0, SIGNATURE.length);
        boolean orientationWritten = false;
        int p = SIGNATURE.length;
        while (true) {
            if (p + 12 > in.length) {
                throw ImageSanitizer.unreadable();
            }
            long length = Bytes.u32be(in, p);
            if (length > in.length - p - 12L) {
                throw ImageSanitizer.unreadable();
            }
            String type = new String(in, p + 4, 4, StandardCharsets.US_ASCII);
            int total = 12 + (int) length;
            if (type.equals("eXIf") && !orientationWritten) {
                int orientation = ExifOrientation.read(in, p + 8, (int) length);
                if (orientation > 1) {
                    writeChunk(out, "eXIf", ExifOrientation.tiff(orientation));
                    orientationWritten = true;
                }
            } else if (!DROPPED.contains(type)) {
                out.write(in, p, total);
            }
            p += total;
            if (type.equals("IEND")) {
                return out.toByteArray();
            }
        }
    }

    private static void writeChunk(ByteArrayOutputStream out, String type, byte[] data) {
        byte[] typeBytes = type.getBytes(StandardCharsets.US_ASCII);
        CRC32 crc = new CRC32();
        crc.update(typeBytes);
        crc.update(data);
        Bytes.writeU32be(out, data.length);
        out.writeBytes(typeBytes);
        out.writeBytes(data);
        Bytes.writeU32be(out, crc.getValue());
    }
}
