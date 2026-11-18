package cafe.community.backend.service;

import cafe.community.backend.mail.FormEmail;
import cafe.community.backend.media.TestImages;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FormAttachmentsTest {

    private static final Set<String> RECEIPT = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final Set<String> POSTER = Set.of("image/jpeg", "image/png", "video/mp4");
    private static final long MB = 1024 * 1024;

    @Test
    void detectsEachAllowedTypeFromItsBytes() {
        assertThat(FormAttachments.detect(TestUploads.pdf())).isEqualTo("application/pdf");
        assertThat(FormAttachments.detect(TestImages.jpeg(2, 2))).isEqualTo("image/jpeg");
        assertThat(FormAttachments.detect(TestImages.png(2, 2))).isEqualTo("image/png");
        assertThat(FormAttachments.detect(TestUploads.mp4(64))).isEqualTo("video/mp4");
    }

    @Test
    void findsAPdfHeaderAfterLeadingJunkWithinTheFirstKilobyte() {
        byte[] late = concat(new byte[1000], TestUploads.pdf());
        byte[] tooLate = concat(new byte[1024], TestUploads.pdf());

        assertThat(FormAttachments.detect(late)).isEqualTo("application/pdf");
        assertThat(FormAttachments.detect(tooLate)).isNull();
    }

    @Test
    void doesNotRecogniseHtmlTextOrTinyFiles() {
        assertThat(FormAttachments.detect(ascii("<html><script>alert(1)</script></html>"))).isNull();
        assertThat(FormAttachments.detect(ascii("plain notes"))).isNull();
        assertThat(FormAttachments.detect(new byte[]{1, 2, 3})).isNull();
        assertThat(FormAttachments.detect(new byte[0])).isNull();
    }

    @Test
    void rejectsHtmlDeclaredAsAPdfWithADoubleExtension() {
        MockMultipartFile disguised = new MockMultipartFile("file", "receipt.pdf.html", "application/pdf",
                ascii("<html><body>Pay here</body></html>"));

        assertThatThrownBy(() -> FormAttachments.require(disguised, RECEIPT, "a PDF or image receipt", 10 * MB,
                "receipt"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported file type. Please upload a PDF or image receipt.");
    }

    @Test
    void rejectsARealFileOfATypeThisFormDoesNotTake() {
        MockMultipartFile pdfPoster = new MockMultipartFile("file", "poster.png", "image/png", TestUploads.pdf());

        assertThatThrownBy(() -> FormAttachments.require(pdfPoster, POSTER, "a JPG, PNG or MP4 poster", 20 * MB,
                "poster"))
                .hasMessage("Unsupported file type. Please upload a JPG, PNG or MP4 poster.");
    }

    @Test
    void namesAndTypesTheAttachmentFromTheBytesNotFromTheVisitor() {
        // A real PNG, uploaded with a misleading name and a generic declared type.
        MockMultipartFile upload = new MockMultipartFile("file", "invoice.exe", "application/octet-stream",
                TestImages.png(2, 2));

        FormEmail.Attachment a = FormAttachments.require(upload, RECEIPT, "a PDF or image receipt", 10 * MB,
                "receipt");

        assertThat(a.filename()).isEqualTo("receipt.png");
        assertThat(a.contentType()).isEqualTo("image/png");
        assertThat(a.data()).isEqualTo(TestImages.png(2, 2));
    }

    @Test
    void givesEachDetectedTypeItsOwnExtension() {
        assertThat(require(TestUploads.pdf(), RECEIPT).filename()).isEqualTo("x.pdf");
        assertThat(require(TestImages.jpeg(2, 2), RECEIPT).filename()).isEqualTo("x.jpg");
        assertThat(require(TestUploads.mp4(64), POSTER).filename()).isEqualTo("x.mp4");
    }

    @Test
    void checksPresenceAndSizeBeforeTheBytes() {
        assertThatThrownBy(() -> FormAttachments.require(null, RECEIPT, "a receipt", MB, "receipt"))
                .hasMessage("Please attach a receipt.");
        MockMultipartFile big = new MockMultipartFile("file", "r.pdf", "application/pdf", new byte[(int) MB + 1]);
        assertThatThrownBy(() -> FormAttachments.require(big, RECEIPT, "a receipt", MB, "receipt"))
                .hasMessage("The file is too large (max 1 MB).");
    }

    private static FormEmail.Attachment require(byte[] data, Set<String> allowed) {
        return FormAttachments.require(new MockMultipartFile("file", "upload", null, data), allowed, "a file",
                20 * MB, "x");
    }

    private static byte[] ascii(String s) {
        return s.getBytes(StandardCharsets.US_ASCII);
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = new byte[a.length + b.length];
        System.arraycopy(a, 0, out, 0, a.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }
}
