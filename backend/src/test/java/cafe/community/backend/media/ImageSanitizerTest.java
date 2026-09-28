package cafe.community.backend.media;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.zip.CRC32;

import static cafe.community.backend.media.TestImages.ascii;
import static cafe.community.backend.media.TestImages.concat;
import static cafe.community.backend.media.TestImages.contains;
import static cafe.community.backend.media.TestImages.indexOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageSanitizerTest {

    // ── JPEG ─────────────────────────────────────────────────────────────────

    @Test
    void jpegLosesGpsXmpIptcCommentsAndTrailingDataButKeepsOrientation() throws IOException {
        byte[] jpeg = TestImages.jpegWithGps("SECRET-GPS-HOME");
        jpeg = TestImages.withJpegSegment(jpeg, 0xE1,
                ascii("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>SECRET-XMP</x:xmpmeta>"));
        jpeg = TestImages.withJpegSegment(jpeg, 0xED, ascii("Photoshop 3.0\0SECRET-IPTC"));
        jpeg = TestImages.withJpegSegment(jpeg, 0xFE, ascii("SECRET-COMMENT"));
        jpeg = TestImages.withJpegSegment(jpeg, 0xE2, ascii("MPF\0SECRET-MPF"));
        jpeg = concat(jpeg, TestImages.jpegWithGps("SECRET-SECOND-IMAGE"));

        byte[] out = ImageSanitizer.sanitize(jpeg, "image/jpeg").bytes();

        assertThat(contains(out, "SECRET")).isFalse();
        assertThat(jpegOrientation(out)).isEqualTo(6);
        assertSameImage(jpeg, out);
    }

    @Test
    void jpegKeepsItsColourProfile() {
        byte[] jpeg = TestImages.withJpegSegment(TestImages.jpeg(40, 20), 0xE2, ascii("ICC_PROFILE\0\1\1KEEP-ICC"));

        assertThat(ImageSanitizer.sanitize(jpeg, "image/jpeg").bytes()).isEqualTo(jpeg);
    }

    @Test
    void cleanJpegIsLeftByteForByteIdentical() {
        byte[] jpeg = TestImages.jpeg(64, 48);

        assertThat(ImageSanitizer.sanitize(jpeg, "image/jpeg").bytes()).isEqualTo(jpeg);
    }

    @Test
    void uprightJpegGetsNoExifAtAll() {
        byte[] jpeg = TestImages.withJpegSegment(TestImages.jpeg(40, 20), 0xE1,
                concat(ascii("Exif\0\0"), TestImages.exifTiff(1, "SECRET")));

        byte[] out = ImageSanitizer.sanitize(jpeg, "image/jpeg").bytes();

        assertThat(contains(out, "Exif")).isFalse();
        assertThat(out).isEqualTo(TestImages.jpeg(40, 20));
    }

    @Test
    void damagedExifStillUploadsWithoutIt() throws IOException {
        byte[] jpeg = TestImages.withJpegSegment(TestImages.jpeg(40, 20), 0xE1,
                ascii("Exif\0\0MM\0*garbage-SECRET"));

        byte[] out = ImageSanitizer.sanitize(jpeg, "image/jpeg").bytes();

        assertThat(contains(out, "SECRET")).isFalse();
        assertSameImage(jpeg, out);
    }

    // ── PNG ──────────────────────────────────────────────────────────────────

    @Test
    void pngLosesTextTimeAndExifButKeepsOrientationWithValidChecksums() throws IOException {
        byte[] png = TestImages.png(30, 30);
        png = TestImages.withPngChunk(png, "tEXt", ascii("Comment\0SECRET-TEXT"));
        png = TestImages.withPngChunk(png, "iTXt", ascii("XML:com.adobe.xmp\0\0\0\0\0SECRET-XMP"));
        png = TestImages.withPngChunk(png, "tIME", new byte[]{0x07, (byte) 0xEA, 9, 28, 12, 0, 0});
        png = TestImages.withPngChunk(png, "eXIf", TestImages.exifTiff(8, "SECRET-GPS"));
        png = concat(png, ascii("SECRET-TRAILER"));

        byte[] out = ImageSanitizer.sanitize(png, "image/png").bytes();

        assertThat(contains(out, "SECRET")).isFalse();
        assertThat(contains(out, "tIME")).isFalse();
        int exif = indexOf(out, ascii("eXIf"));
        assertThat(exif).isPositive();
        assertThat(ExifOrientation.read(out, exif + 4, 26)).isEqualTo(8);
        assertValidPngChecksums(out);
        assertSameImage(png, out);
    }

    // ── GIF ──────────────────────────────────────────────────────────────────

    @Test
    void gifLosesCommentsAndXmpButKeepsTheLoopExtension() throws IOException {
        byte[] gif = TestImages.gif(20, 10);
        int flags = gif[10] & 0xFF;
        int afterHeader = 13 + ((flags & 0x80) != 0 ? 3 * (1 << ((flags & 0x07) + 1)) : 0);
        byte[] comment = concat(new byte[]{0x21, (byte) 0xFE, 14}, ascii("SECRET-COMMENT"), new byte[]{0});
        byte[] xmp = concat(new byte[]{0x21, (byte) 0xFF, 11}, ascii("XMP DataXMP"),
                new byte[]{10}, ascii("SECRET-XMP"), new byte[]{0});
        byte[] loop = concat(new byte[]{0x21, (byte) 0xFF, 11}, ascii("NETSCAPE2.0"),
                new byte[]{3, 1, 0, 0, 0});
        gif = concat(TestImages.slice(gif, 0, afterHeader), loop, comment, xmp,
                TestImages.slice(gif, afterHeader, gif.length));

        byte[] out = ImageSanitizer.sanitize(gif, "image/gif").bytes();

        assertThat(contains(out, "SECRET")).isFalse();
        assertThat(contains(out, "NETSCAPE2.0")).isTrue();
        assertSameImage(gif, out);
    }

    // ── WebP ─────────────────────────────────────────────────────────────────

    @Test
    void webpLosesExifAndXmpChunksAndFlagsButKeepsImageDataAndOrientation() {
        byte[] vp8x = webpChunk("VP8X", new byte[]{0x10 | 0x08 | 0x04, 0, 0, 0, 19, 0, 0, 9, 0, 0});
        byte[] image = webpChunk("VP8L", ascii("KEEP1"));
        byte[] exif = webpChunk("EXIF", concat(ascii("Exif\0\0"), TestImages.exifTiff(6, "SECRET-GPS")));
        byte[] xmp = webpChunk("XMP ", ascii("SECRET-XMP"));
        byte[] webp = concat(riff(concat(vp8x, image, exif, xmp)), ascii("SECRET-TRAILER"));

        byte[] out = ImageSanitizer.sanitize(webp, "image/webp").bytes();

        assertThat(contains(out, "SECRET")).isFalse();
        assertThat(ByteBuffer.wrap(out, 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt()).isEqualTo(out.length - 8);
        assertThat(out[20] & 0xFF).as("VP8X flags: alpha and EXIF kept, XMP cleared").isEqualTo(0x10 | 0x08);
        assertThat(indexOf(out, image)).as("image chunk byte-identical").isPositive();
        int exifAt = indexOf(out, ascii("EXIF"));
        assertThat(ExifOrientation.read(out, exifAt + 8, 26)).isEqualTo(6);
    }

    @Test
    void webpWithoutOrientationClearsTheExifFlag() {
        byte[] vp8x = webpChunk("VP8X", new byte[]{0x08, 0, 0, 0, 19, 0, 0, 9, 0, 0});
        byte[] exif = webpChunk("EXIF", TestImages.exifTiff(1, "SECRET-GPS"));
        byte[] webp = riff(concat(vp8x, webpChunk("VP8L", ascii("KEEP")), exif));

        byte[] out = ImageSanitizer.sanitize(webp, "image/webp").bytes();

        assertThat(contains(out, "EXIF")).isFalse();
        assertThat(out[20]).isZero();
    }

    // ── Type validation ──────────────────────────────────────────────────────

    @Test
    void textFileClaimingToBeAPngIsRejected() {
        assertThatThrownBy(() -> ImageSanitizer.sanitize(ascii("just some text, not an image"), "image/png"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not a JPEG, PNG, WebP or GIF image");
    }

    @Test
    void pngClaimingToBeAJpegIsRejected() {
        assertThatThrownBy(() -> ImageSanitizer.sanitize(TestImages.png(4, 4), "image/jpeg"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("named as a JPEG but is really a PNG");
    }

    @Test
    void truncatedOrFakeImagesAreRejectedAsUnreadable() {
        byte[] jpeg = TestImages.jpeg(64, 48);
        byte[] webp = riff(webpChunk("VP8L", new byte[4]));
        byte[][] broken = {
                TestImages.slice(jpeg, 0, jpeg.length / 2),
                concat(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}, new byte[64]),
                TestImages.slice(TestImages.png(8, 8), 0, 40),
                TestImages.slice(webp, 0, webp.length - 3),
                TestImages.slice(TestImages.gif(8, 8), 0, 30),
        };

        for (byte[] input : broken) {
            String type = ImageSanitizer.detect(input);
            assertThat(type).isNotNull();
            assertThatThrownBy(() -> ImageSanitizer.sanitize(input, type))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("could not be read");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static void assertSameImage(byte[] original, byte[] sanitized) throws IOException {
        BufferedImage a = ImageIO.read(new ByteArrayInputStream(original));
        BufferedImage b = ImageIO.read(new ByteArrayInputStream(sanitized));
        assertThat(b).as("sanitized image still decodes").isNotNull();
        assertThat(b.getWidth()).isEqualTo(a.getWidth());
        assertThat(b.getHeight()).isEqualTo(a.getHeight());
        for (int x = 0; x < a.getWidth(); x++) {
            for (int y = 0; y < a.getHeight(); y++) {
                assertThat(b.getRGB(x, y)).isEqualTo(a.getRGB(x, y));
            }
        }
    }

    private static int jpegOrientation(byte[] jpeg) {
        int exif = indexOf(jpeg, ascii("Exif\0\0"));
        return exif < 0 ? 0 : ExifOrientation.read(jpeg, exif + 6, jpeg.length - exif - 6);
    }

    private static void assertValidPngChecksums(byte[] png) {
        int p = 8;
        while (p < png.length) {
            int length = ByteBuffer.wrap(png, p, 4).getInt();
            CRC32 crc = new CRC32();
            crc.update(png, p + 4, 4 + length);
            assertThat(ByteBuffer.wrap(png, p + 8 + length, 4).getInt()).isEqualTo((int) crc.getValue());
            p += 12 + length;
        }
    }

    private static byte[] webpChunk(String fourcc, byte[] data) {
        ByteBuffer b = ByteBuffer.allocate(8 + data.length + (data.length & 1)).order(ByteOrder.LITTLE_ENDIAN);
        b.put(ascii(fourcc)).putInt(data.length).put(data);
        return b.array();
    }

    private static byte[] riff(byte[] chunks) {
        ByteBuffer b = ByteBuffer.allocate(12 + chunks.length).order(ByteOrder.LITTLE_ENDIAN);
        b.put(ascii("RIFF")).putInt(chunks.length + 4).put(ascii("WEBP")).put(chunks);
        return b.array();
    }
}
