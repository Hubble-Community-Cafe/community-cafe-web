package cafe.community.backend.media;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

/** Real images generated with the JDK, plus helpers to plant metadata in them for tests. */
public final class TestImages {

    private TestImages() {
    }

    public static byte[] jpeg(int width, int height) {
        return encode("jpg", width, height, BufferedImage.TYPE_INT_RGB);
    }

    public static byte[] png(int width, int height) {
        return encode("png", width, height, BufferedImage.TYPE_INT_ARGB);
    }

    public static byte[] gif(int width, int height) {
        return encode("gif", width, height, BufferedImage.TYPE_INT_RGB);
    }

    /** A JPEG as a phone writes it: EXIF with orientation 6 and a GPS block holding {@code secret}. */
    public static byte[] jpegWithGps(String secret) {
        return withJpegSegment(jpeg(40, 20), 0xE1, concat(ascii("Exif\0\0"), exifTiff(6, secret)));
    }

    /**
     * A little-endian TIFF structure like a camera writes: an ImageDescription holding
     * {@code secret}, the orientation, and a pointer to a GPS IFD with a latitude reference.
     */
    static byte[] exifTiff(int orientation, String secret) {
        byte[] text = ascii(secret + "\0");
        ByteBuffer b = ByteBuffer.allocate(68 + text.length).order(ByteOrder.LITTLE_ENDIAN);
        b.put((byte) 'I').put((byte) 'I').putShort((short) 42).putInt(8);
        b.putShort((short) 3);                                                           // IFD0 at 8
        b.putShort((short) 0x010E).putShort((short) 2).putInt(text.length).putInt(68);  // ImageDescription
        b.putShort((short) 0x0112).putShort((short) 3).putInt(1).putShort((short) orientation).putShort((short) 0);
        b.putShort((short) 0x8825).putShort((short) 4).putInt(1).putInt(50);            // GPS IFD pointer
        b.putInt(0);
        b.putShort((short) 1);                                                           // GPS IFD at 50
        b.putShort((short) 0x0001).putShort((short) 2).putInt(2).put((byte) 'N').put((byte) 0).putShort((short) 0);
        b.putInt(0);
        b.put(text);                                                                     // at 68
        return b.array();
    }

    /** Inserts a JPEG segment right after the start-of-image marker. */
    static byte[] withJpegSegment(byte[] jpeg, int marker, byte[] payload) {
        int length = payload.length + 2;
        byte[] header = {(byte) 0xFF, (byte) marker, (byte) (length >>> 8), (byte) length};
        return concat(slice(jpeg, 0, 2), header, payload, slice(jpeg, 2, jpeg.length));
    }

    /** Inserts a PNG chunk with a valid CRC right after IHDR. */
    static byte[] withPngChunk(byte[] png, String type, byte[] data) {
        int afterIhdr = 8 + 12 + 13;
        return concat(slice(png, 0, afterIhdr), pngChunk(type, data), slice(png, afterIhdr, png.length));
    }

    static byte[] pngChunk(String type, byte[] data) {
        byte[] typeBytes = ascii(type);
        CRC32 crc = new CRC32();
        crc.update(typeBytes);
        crc.update(data);
        ByteBuffer b = ByteBuffer.allocate(12 + data.length);
        b.putInt(data.length).put(typeBytes).put(data).putInt((int) crc.getValue());
        return b.array();
    }

    static byte[] ascii(String s) {
        return s.getBytes(StandardCharsets.ISO_8859_1);
    }

    static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] part : parts) {
            out.writeBytes(part);
        }
        return out.toByteArray();
    }

    static byte[] slice(byte[] b, int from, int to) {
        return java.util.Arrays.copyOfRange(b, from, to);
    }

    static boolean contains(byte[] haystack, String needle) {
        return indexOf(haystack, ascii(needle)) >= 0;
    }

    static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }

    private static byte[] encode(String format, int width, int height, int type) {
        BufferedImage image = new BufferedImage(width, height, type);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(15, 77, 100));
        g.fillRect(0, 0, width, height);
        g.setColor(Color.ORANGE);
        g.fillRect(0, 0, width / 2, height / 2);
        g.dispose();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(image, format, out)) {
                throw new IllegalStateException("No ImageIO writer for " + format);
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
