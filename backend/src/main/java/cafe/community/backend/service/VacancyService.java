package cafe.community.backend.service;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.MediaAssetRepository;
import cafe.community.backend.repository.VacancyRepository;
import cafe.community.backend.util.SortOrders;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VacancyService {

    private final VacancyRepository repo;
    private final MediaAssetRepository mediaRepo;
    private final AuditService auditService;

    public VacancyService(VacancyRepository repo, MediaAssetRepository mediaRepo, AuditService auditService) {
        this.repo = repo;
        this.mediaRepo = mediaRepo;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> getActive(BarLocation bar) {
        return repo.findActiveForBar(bar).stream().map(VacancyDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> getAll() {
        return repo.findAllByOrderBySortOrderAscTitleAsc().stream().map(VacancyDto::from).toList();
    }

    public VacancyDto create(VacancyRequest req) {
        Vacancy v = new Vacancy();
        apply(v, req);
        Vacancy saved = repo.save(v);
        auditService.recordCreate(AuditEntityType.VACANCY, saved.getId(), saved.getTitle(),
                List.of(), "Created vacancy: " + saved.getTitle());
        return VacancyDto.from(saved);
    }

    public VacancyDto update(Long id, VacancyRequest req) {
        Vacancy v = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vacancy not found: " + id));
        apply(v, req);
        Vacancy saved = repo.save(v);
        auditService.recordAction(AuditEntityType.VACANCY, saved.getId(), saved.getTitle(),
                AuditAction.UPDATE, List.of(), "Updated vacancy: " + saved.getTitle());
        return VacancyDto.from(saved);
    }

    /**
     * Re-number the vacancies from a dragged order. Kept out of {@link #update} so a drag only ever
     * writes sort orders and cannot clobber another editor's changes.
     */
    public void reorder(List<Long> orderedIds) {
        List<Vacancy> vacancies = repo.findAllByOrderBySortOrderAscTitleAsc();
        SortOrders.apply(vacancies, orderedIds, Vacancy::getId, Vacancy::setSortOrder);
        repo.saveAll(vacancies);
        auditService.recordAction(AuditEntityType.VACANCY, null, "Vacancies",
                AuditAction.REORDER, List.of(), "Reordered " + vacancies.size() + " vacancies");
    }

    public void delete(Long id) {
        Vacancy v = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vacancy not found: " + id));
        String title = v.getTitle();
        repo.deleteById(id);
        auditService.recordDelete(AuditEntityType.VACANCY, id, title, "Deleted vacancy: " + title);
    }

    private void apply(Vacancy v, VacancyRequest req) {
        v.setTitle(req.title());
        v.setDescription(req.description());
        v.setHours(req.hours());
        v.setType(req.type());
        v.setApplyEmail(req.applyEmail());
        v.setApplyLink(req.applyLink());
        v.setBar(req.bar() != null && !req.bar().isBlank() ? BarLocation.valueOf(req.bar()) : null);
        v.setActive(req.active());
        v.setSortOrder(req.sortOrder());
        MediaAsset image = req.imageId() != null
                ? mediaRepo.findById(req.imageId()).orElse(null) : null;
        v.setImage(image);
    }
}
