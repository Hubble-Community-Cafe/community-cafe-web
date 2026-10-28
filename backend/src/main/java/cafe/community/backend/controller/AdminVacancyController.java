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

/** Admin CRUD for vacancies. Reads need Vacancies view; writes need Vacancies edit. */
@RestController
@PreAuthorize("hasAuthority('VACANCIES_VIEW')")
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
    @PreAuthorize("hasAuthority('VACANCIES_EDIT')")
    public VacancyDto create(@RequestBody @Valid VacancyRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('VACANCIES_EDIT')")
    public VacancyDto update(@PathVariable Long id, @RequestBody @Valid VacancyRequest req) {
        return service.update(id, req);
    }

    /** Apply a dragged order to the vacancies. */
    @PatchMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('VACANCIES_EDIT')")
    public void reorder(@RequestBody @Valid ReorderRequest req) {
        service.reorder(req.orderedIds());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('VACANCIES_EDIT')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
