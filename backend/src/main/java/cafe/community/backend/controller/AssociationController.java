package cafe.community.backend.controller;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.AssociationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) associations endpoint consumed by both public sites. */
@RestController
@RequestMapping("/api/associations")
public class AssociationController {

    private final AssociationService service;

    public AssociationController(AssociationService service) {
        this.service = service;
    }

    @GetMapping("/{bar}")
    public List<AssociationDto> forBar(@PathVariable BarLocation bar) {
        return service.getForBar(bar);
    }
}
