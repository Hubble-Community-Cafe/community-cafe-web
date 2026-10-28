package cafe.community.backend.controller;

import cafe.community.backend.dto.MediaAssetDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.MediaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Media assets. Editing Board, Vacancies or Associations includes picking and uploading their
 * images through the media picker, so those may list and upload too; deleting needs Media edit.
 */
@RestController
@RequestMapping("/api/admin/media")
public class MediaController {

    /** The tabs whose edit forms embed the media picker. */
    private static final String PICKER_EDITORS =
            "hasAnyAuthority('BOARD_EDIT', 'VACANCIES_EDIT', 'ASSOCIATIONS_EDIT')";

    private final MediaService service;

    public MediaController(MediaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MEDIA_VIEW') or " + PICKER_EDITORS)
    public List<MediaAssetDto> list() {
        return service.getAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MEDIA_EDIT') or " + PICKER_EDITORS)
    public MediaAssetDto upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String alt,
            @RequestParam(required = false) String bar) {
        BarLocation barLocation = bar != null && !bar.isBlank() ? BarLocation.valueOf(bar) : null;
        return service.upload(file, alt, barLocation);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('MEDIA_EDIT')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
