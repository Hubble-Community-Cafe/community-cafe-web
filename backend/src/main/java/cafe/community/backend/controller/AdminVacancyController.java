package cafe.community.backend.controller;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.service.VacancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public VacancyDto create(@RequestBody @Valid VacancyRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public VacancyDto update(@PathVariable Long id, @RequestBody @Valid VacancyRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
