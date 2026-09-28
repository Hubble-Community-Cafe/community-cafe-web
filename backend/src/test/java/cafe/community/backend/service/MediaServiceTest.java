package cafe.community.backend.service;

import cafe.community.backend.dto.MediaAssetDto;
import cafe.community.backend.media.TestImages;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MediaAsset;
import cafe.community.backend.repository.MediaAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The upload path: what ends up in the public media folder, and what is refused before it. */
class MediaServiceTest {

    @TempDir
    Path mediaDir;

    private final MediaAssetRepository repo = mock(MediaAssetRepository.class);

    private MediaService service;

    @BeforeEach
    void setUp() {
        service = new MediaService(repo, mock(AuditService.class));
        ReflectionTestUtils.setField(service, "mediaDir", mediaDir.toString());
        ReflectionTestUtils.setField(service, "mediaBaseUrl", "https://api.test.invalid");
        when(repo.save(any(MediaAsset.class))).thenAnswer(inv -> {
            MediaAsset asset = inv.getArgument(0);
            asset.setId(1L);
            asset.setCreatedAt(LocalDateTime.now());
            return asset;
        });
    }

    @Test
    void gpsTaggedPhotoIsStoredWithoutItsLocation() throws IOException {
        byte[] photo = TestImages.jpegWithGps("SECRET-GPS-HOME");
        MockMultipartFile file = new MockMultipartFile("file", "portrait.jpg", "image/jpeg", photo);

        MediaAssetDto dto = service.upload(file, "Board portrait", BarLocation.HUBBLE);

        byte[] stored = Files.readAllBytes(mediaDir.resolve(dto.filename()));
        assertThat(new String(stored, StandardCharsets.ISO_8859_1)).doesNotContain("SECRET-GPS-HOME");
        assertThat(dto.filename()).endsWith(".jpg");
        assertThat(dto.contentType()).isEqualTo("image/jpeg");
        assertThat(dto.sizeBytes()).as("size of the stored, stripped file").isEqualTo(stored.length);
        assertThat(stored.length).isLessThan(photo.length);
    }

    @Test
    void textFileSentAsPngIsRefusedAndNothingIsStored() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "notes.png", "image/png",
                "not an image at all".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.upload(file, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not a JPEG, PNG, WebP or GIF image");

        try (var files = Files.list(mediaDir)) {
            assertThat(files).isEmpty();
        }
        verify(repo, never()).save(any());
    }

    @Test
    void unsupportedDeclaredTypeIsStillRefusedFirst() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf",
                "%PDF-1.7".getBytes(StandardCharsets.US_ASCII));

        assertThatThrownBy(() -> service.upload(file, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported file type");
    }

    @Test
    void pngAndGifAreStoredWithTheirOwnExtension() {
        MediaAssetDto png = service.upload(
                new MockMultipartFile("file", "logo.png", "image/png", TestImages.png(8, 8)), null, null);
        MediaAssetDto gif = service.upload(
                new MockMultipartFile("file", "anim.gif", "image/gif", TestImages.gif(8, 8)), null, BarLocation.METEOR);

        assertThat(png.filename()).endsWith(".png");
        assertThat(png.contentType()).isEqualTo("image/png");
        assertThat(gif.filename()).endsWith(".gif");
        assertThat(gif.bar()).isEqualTo("METEOR");
        assertThat(mediaDir.resolve(png.filename())).exists();
        assertThat(mediaDir.resolve(gif.filename())).exists();
    }

    @Test
    void deletingAnUnknownAssetFailsAndTouchesNothing() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(99L)).isInstanceOf(EntityNotFoundException.class);
        verify(repo, never()).deleteById(any());
    }

    // ── Deleting ─────────────────────────────────────────────────────────────

    @Test
    void anImageStillInUseIsRefusedWithWhatUsesItAndKeepsItsFile() {
        MediaAssetDto dto = service.upload(
                new MockMultipartFile("file", "quiz.jpg", "image/jpeg", TestImages.jpeg(8, 8)), null, null);
        MediaAsset stored = storedAsset(1L, dto.filename());
        when(repo.eventsUsing(1L)).thenReturn(List.of("Pub quiz"));

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(MediaInUseException.class)
                .hasMessage("This image is still used by the event 'Pub quiz'. Choose another image there first.");

        assertThat(mediaDir.resolve(stored.getFilename())).exists();
        verify(repo, never()).delete(any(MediaAsset.class));
    }

    @Test
    void anUnusedImageLosesItsRowAndThenItsFile() {
        MediaAssetDto dto = service.upload(
                new MockMultipartFile("file", "old.jpg", "image/jpeg", TestImages.jpeg(8, 8)), null, null);
        MediaAsset stored = storedAsset(1L, dto.filename());

        service.delete(1L);

        verify(repo).delete(stored);
        verify(repo).flush();
        assertThat(mediaDir.resolve(dto.filename())).doesNotExist();
    }

    @Test
    void theFileIsKeptWhenDeletingTheRowFails() {
        MediaAssetDto dto = service.upload(
                new MockMultipartFile("file", "race.jpg", "image/jpeg", TestImages.jpeg(8, 8)), null, null);
        storedAsset(1L, dto.filename());
        // Chosen for something else between the usage check and the delete.
        doThrow(new DataIntegrityViolationException("FK")).when(repo).flush();

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(MediaInUseException.class)
                .hasMessageContaining("just chosen for something else");

        assertThat(mediaDir.resolve(dto.filename())).exists();
    }

    @Test
    void theInUseMessageListsUpToThreeUsesAndCountsTheRest() {
        assertThat(MediaService.inUseMessage(List.of("the event 'A'", "the vacancy 'B'")))
                .isEqualTo("This image is still used by the event 'A' and the vacancy 'B'. Choose another image there first.");
        assertThat(MediaService.inUseMessage(List.of("a", "b", "c")))
                .isEqualTo("This image is still used by a, b and c. Choose another image there first.");
        assertThat(MediaService.inUseMessage(List.of("a", "b", "c", "d", "e")))
                .isEqualTo("This image is still used by a, b, c and 2 more. Choose another image there first.");
    }

    @Test
    void everyKindOfUseIsNamed() {
        when(repo.menuItemsUsing(5L)).thenReturn(List.of("House Pils"));
        when(repo.dailyDishesUsing(5L)).thenReturn(List.of("Curry"));
        when(repo.boardMembersUsing(5L)).thenReturn(List.of("Robin"));
        when(repo.boardTermsUsing(5L)).thenReturn(List.of("Board 2026"));
        when(repo.vacanciesUsing(5L)).thenReturn(List.of("Bartender"));
        when(repo.associationsUsing(5L)).thenReturn(List.of("Inter Actief"));

        assertThat(service.usagesOf(5L)).containsExactly(
                "the menu item 'House Pils'", "the daily dish 'Curry'", "the board member 'Robin'",
                "the group photo of 'Board 2026'", "the vacancy 'Bartender'", "the logo of 'Inter Actief'");
    }

    private MediaAsset storedAsset(Long id, String filename) {
        MediaAsset asset = new MediaAsset();
        asset.setId(id);
        asset.setFilename(filename);
        when(repo.findById(id)).thenReturn(Optional.of(asset));
        return asset;
    }
}
