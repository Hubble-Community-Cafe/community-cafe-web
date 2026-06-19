package cafe.community.backend.controller;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.service.AssociationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/associations")
public class AdminAssociationController {

    private final AssociationService service;

    public AdminAssociationController(AssociationService service) {
        this.service = service;
    }

    @GetMapping
    public List<AssociationDto> list() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssociationDto create(@RequestBody @Valid AssociationRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public AssociationDto update(@PathVariable Long id, @RequestBody @Valid AssociationRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
