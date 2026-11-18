package cafe.community.backend.service;

import java.nio.charset.StandardCharsets;

/** Smallest files that pass the public forms' byte checks (see {@code FormAttachments}). */
public final class TestUploads {

    private TestUploads() {
    }

    /** A minimal PDF: just the header and trailer a PDF reader looks for. */
    public static byte[] pdf() {
        return "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF".getBytes(StandardCharsets.US_ASCII);
    }

    /** An MP4-shaped file of the given size: an "ftyp" box at the start, zeros after it. */
    public static byte[] mp4(int size) {
        byte[] b = new byte[size];
        byte[] header = {0, 0, 0, 0x18, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'};
        System.arraycopy(header, 0, b, 0, header.length);
        return b;
    }
}
