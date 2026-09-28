package cafe.community.backend.media;

import java.io.ByteArrayOutputStream;

/**
 * Removes metadata from a GIF without re-encoding it: comment extensions and application
 * extensions (XMP lives there), except the looping extension that animated GIFs need. Frames,
 * colour tables and frame timing are kept. Stops at the trailer, so appended data is dropped.
 */
final class GifMetadata {

    private static final int EXTENSION = 0x21;
    private static final int IMAGE = 0x2C;
    private static final int TRAILER = 0x3B;
    private static final int COMMENT = 0xFE;
    private static final int APPLICATION = 0xFF;

    private GifMetadata() {
    }

    static byte[] strip(byte[] in) {
        if (in.length < 13) {
            throw ImageSanitizer.unreadable();
        }
        int p = 13 + colorTableSize(Bytes.u8(in, 10));
        if (p > in.length) {
            throw ImageSanitizer.unreadable();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(in.length);
        out.write(in, 0, p);
        while (true) {
            if (p >= in.length) {
                throw ImageSanitizer.unreadable();
            }
            int block = Bytes.u8(in, p);
            if (block == TRAILER) {
                out.write(TRAILER);
                return out.toByteArray();
            }
            int start = p;
            if (block == IMAGE) {
                if (p + 11 > in.length) {
                    throw ImageSanitizer.unreadable();
                }
                p += 10 + colorTableSize(Bytes.u8(in, p + 9));
                p = skipSubBlocks(in, p + 1); // +1 for the LZW minimum code size
                out.write(in, start, p - start);
            } else if (block == EXTENSION) {
                if (p + 2 > in.length) {
                    throw ImageSanitizer.unreadable();
                }
                int label = Bytes.u8(in, p + 1);
                p = skipSubBlocks(in, p + 2);
                boolean keep = label != COMMENT && (label != APPLICATION || isLoopExtension(in, start + 2));
                if (keep) {
                    out.write(in, start, p - start);
                }
            } else {
                throw ImageSanitizer.unreadable();
            }
        }
    }

    private static int colorTableSize(int flags) {
        return (flags & 0x80) != 0 ? 3 * (1 << ((flags & 0x07) + 1)) : 0;
    }

    private static int skipSubBlocks(byte[] in, int p) {
        while (true) {
            if (p >= in.length) {
                throw ImageSanitizer.unreadable();
            }
            int size = Bytes.u8(in, p);
            p++;
            if (size == 0) {
                return p;
            }
            p += size;
        }
    }

    private static boolean isLoopExtension(byte[] in, int firstSubBlock) {
        return Bytes.u8(in, firstSubBlock) == 11
                && (Bytes.ascii(in, firstSubBlock + 1, "NETSCAPE2.0") || Bytes.ascii(in, firstSubBlock + 1, "ANIMEXTS1.0"));
    }
}
