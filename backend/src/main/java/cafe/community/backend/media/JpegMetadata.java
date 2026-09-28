package cafe.community.backend.media;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Removes metadata from a JPEG without re-encoding it. Drops EXIF and XMP (APP1), IPTC (APP13),
 * comments and every other APPn segment, keeping JFIF (APP0), ICC colour profiles (APP2) and the
 * Adobe colour transform (APP14). The orientation survives as a minimal EXIF block. Stops at the
 * end-of-image marker, so data appended after it (phones add secondary images there, each with
 * its own EXIF) is dropped too.
 */
final class JpegMetadata {

    private static final int SOS = 0xDA;
    private static final int EOI = 0xD9;
    private static final int APP0 = 0xE0;
    private static final int APP1 = 0xE1;
    private static final int APP2 = 0xE2;
    private static final int APP14 = 0xEE;
    private static final int APP15 = 0xEF;
    private static final int COM = 0xFE;

    private JpegMetadata() {
    }

    static byte[] strip(byte[] in) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(in.length);
        out.write(0xFF);
        out.write(0xD8);
        boolean orientationWritten = false;
        int p = 2;
        while (true) {
            if (p + 1 >= in.length || Bytes.u8(in, p) != 0xFF) {
                throw ImageSanitizer.unreadable();
            }
            // Any number of 0xFF fill bytes may precede a marker.
            while (Bytes.u8(in, p + 1) == 0xFF) {
                p++;
                if (p + 1 >= in.length) {
                    throw ImageSanitizer.unreadable();
                }
            }
            int marker = Bytes.u8(in, p + 1);
            p += 2;
            if (marker == EOI) {
                out.write(0xFF);
                out.write(EOI);
                return out.toByteArray();
            }
            if (marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
                out.write(0xFF);
                out.write(marker);
                continue;
            }
            if (p + 2 > in.length) {
                throw ImageSanitizer.unreadable();
            }
            int length = Bytes.u16be(in, p);
            if (length < 2 || p + length > in.length) {
                throw ImageSanitizer.unreadable();
            }
            if (marker == APP1 && Bytes.ascii(in, p + 2, "Exif\0\0") && !orientationWritten) {
                int orientation = ExifOrientation.read(in, p + 8, length - 8);
                if (orientation > 1) {
                    writeOrientation(out, orientation);
                    orientationWritten = true;
                }
            }
            if (keep(marker, in, p + 2)) {
                out.write(0xFF);
                out.write(marker);
                out.write(in, p, length);
            }
            p += length;
            if (marker == SOS) {
                p = copyEntropyData(in, p, out);
            }
        }
    }

    private static boolean keep(int marker, byte[] in, int data) {
        if (marker == APP0 || marker == APP14) {
            return true;
        }
        if (marker == APP2) {
            return Bytes.ascii(in, data, "ICC_PROFILE\0");
        }
        return marker != COM && (marker < APP0 || marker > APP15);
    }

    /**
     * Copies the compressed scan data that follows a start-of-scan header, up to the next real
     * marker. Inside the scan, 0xFF is followed by 0x00 (a stuffed byte) or a restart marker.
     */
    private static int copyEntropyData(byte[] in, int p, ByteArrayOutputStream out) {
        int start = p;
        while (true) {
            if (p + 1 >= in.length) {
                throw ImageSanitizer.unreadable();
            }
            if (Bytes.u8(in, p) == 0xFF) {
                int next = Bytes.u8(in, p + 1);
                if (next == 0x00 || (next >= 0xD0 && next <= 0xD7)) {
                    p += 2;
                    continue;
                }
                out.write(in, start, p - start);
                return p;
            }
            p++;
        }
    }

    private static void writeOrientation(ByteArrayOutputStream out, int orientation) {
        byte[] tiff = ExifOrientation.tiff(orientation);
        int length = 2 + 6 + tiff.length;
        out.write(0xFF);
        out.write(APP1);
        out.write(length >>> 8);
        out.write(length);
        out.writeBytes("Exif\0\0".getBytes(StandardCharsets.US_ASCII));
        out.writeBytes(tiff);
    }
}
