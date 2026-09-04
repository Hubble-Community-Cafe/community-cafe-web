package cafe.community.backend.controller;

import cafe.community.backend.dto.ReorderRequest;
import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.service.VacancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for vacancies. Reads open to any signed-in staff; writes require EDITOR. */
@RestController
@RequestMapping("/api/admin/vacancies")
public class AdminVacancyController {

    private final VacancyService service;

    public AdminVacancyController(VacancyService service) {
        this.service = service;
    }

    @GetMapping
    public List<VacancyDto> list() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EDITOR')")
    public VacancyDto create(@RequestBody @Valid VacancyRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EDITOR')")
    public VacancyDto update(@PathVariable Long id, @RequestBody @Valid VacancyRequest req) {
        return service.update(id, req);
    }

    /** Apply a dragged order to the vacancies. */
    @PatchMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void reorder(@RequestBody @Valid ReorderRequest req) {
        service.reorder(req.orderedIds());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
