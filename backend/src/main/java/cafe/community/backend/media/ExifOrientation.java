package cafe.community.backend.media;

/**
 * Reads the orientation tag from an EXIF (TIFF) structure and writes a minimal EXIF block that
 * holds only that tag. Stripping all metadata would otherwise lose the rotation, and phone
 * portraits would then show sideways.
 */
final class ExifOrientation {

    private static final int ORIENTATION_TAG = 0x0112;
    private static final int TYPE_SHORT = 3;

    private ExifOrientation() {
    }

    /**
     * The orientation (1 to 8) in IFD0 of the TIFF structure at {@code off}, or 0 when it is absent
     * or unreadable. Never throws: a broken EXIF block only means the orientation is lost.
     */
    static int read(byte[] b, int off, int len) {
        try {
            int end = off + len;
            if (len < 8 || end > b.length) {
                return 0;
            }
            boolean le;
            if (b[off] == 'I' && b[off + 1] == 'I') {
                le = true;
            } else if (b[off] == 'M' && b[off + 1] == 'M') {
                le = false;
            } else {
                return 0;
            }
            if (u16(b, off + 2, le) != 42) {
                return 0;
            }
            long ifd = le ? Bytes.u32le(b, off + 4) : Bytes.u32be(b, off + 4);
            if (ifd < 8 || off + ifd + 2 > end) {
                return 0;
            }
            int p = off + (int) ifd;
            int count = u16(b, p, le);
            for (int i = 0; i < count; i++) {
                int entry = p + 2 + i * 12;
                if (entry + 12 > end) {
                    return 0;
                }
                if (u16(b, entry, le) == ORIENTATION_TAG && u16(b, entry + 2, le) == TYPE_SHORT) {
                    int value = u16(b, entry + 8, le);
                    return value >= 1 && value <= 8 ? value : 0;
                }
            }
            return 0;
        } catch (IndexOutOfBoundsException e) {
            return 0;
        }
    }

    /** A big-endian TIFF structure with one IFD holding only the orientation tag (26 bytes). */
    static byte[] tiff(int orientation) {
        return new byte[]{
                'M', 'M', 0, 42, 0, 0, 0, 8,        // header, IFD0 at offset 8
                0, 1,                               // one entry
                0x01, 0x12, 0, TYPE_SHORT,          // tag 0x0112, type SHORT
                0, 0, 0, 1,                         // count 1
                0, (byte) orientation, 0, 0,        // value, padded to 4 bytes
                0, 0, 0, 0                          // no next IFD
        };
    }

    private static int u16(byte[] b, int p, boolean le) {
        return le ? Bytes.u16le(b, p) : Bytes.u16be(b, p);
    }
}
