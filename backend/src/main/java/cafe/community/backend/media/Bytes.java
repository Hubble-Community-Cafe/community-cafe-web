package cafe.community.backend.media;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** Small unsigned readers and writers for the image container formats. */
final class Bytes {

    private Bytes() {
    }

    static int u8(byte[] b, int p) {
        return b[p] & 0xFF;
    }

    static int u16be(byte[] b, int p) {
        return (u8(b, p) << 8) | u8(b, p + 1);
    }

    static int u16le(byte[] b, int p) {
        return u8(b, p) | (u8(b, p + 1) << 8);
    }

    static long u32be(byte[] b, int p) {
        return ((long) u16be(b, p) << 16) | u16be(b, p + 2);
    }

    static long u32le(byte[] b, int p) {
        return u16le(b, p) | ((long) u16le(b, p + 2) << 16);
    }

    /** True when {@code b} holds the ASCII text {@code s} at position {@code p}. */
    static boolean ascii(byte[] b, int p, String s) {
        byte[] expected = s.getBytes(StandardCharsets.US_ASCII);
        if (p < 0 || p + expected.length > b.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (b[p + i] != expected[i]) {
                return false;
            }
        }
        return true;
    }

    static void writeU32be(ByteArrayOutputStream out, long v) {
        out.write((int) (v >>> 24));
        out.write((int) (v >>> 16));
        out.write((int) (v >>> 8));
        out.write((int) v);
    }

    static void writeU32le(ByteArrayOutputStream out, long v) {
        out.write((int) v);
        out.write((int) (v >>> 8));
        out.write((int) (v >>> 16));
        out.write((int) (v >>> 24));
    }
}
