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

/** Media assets. Reads open to any signed-in staff; uploads and deletes require EDITOR. */
@RestController
@RequestMapping("/api/admin/media")
public class MediaController {

    private final MediaService service;

    public MediaController(MediaService service) {
        this.service = service;
    }

    @GetMapping
    public List<MediaAssetDto> list() {
        return service.getAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EDITOR')")
    public MediaAssetDto upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String alt,
            @RequestParam(required = false) String bar) {
        BarLocation barLocation = bar != null && !bar.isBlank() ? BarLocation.valueOf(bar) : null;
        return service.upload(file, alt, barLocation);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
