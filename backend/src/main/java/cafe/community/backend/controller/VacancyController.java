package cafe.community.backend.controller;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.VacancyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public (unauthenticated) vacancies endpoint consumed by both public sites. */
@RestController
@RequestMapping("/api/vacancies")
public class VacancyController {

    private final VacancyService service;

    public VacancyController(VacancyService service) {
        this.service = service;
    }

    @GetMapping("/{bar}")
    public List<VacancyDto> active(@PathVariable BarLocation bar) {
        return service.getActive(bar);
    }
}
