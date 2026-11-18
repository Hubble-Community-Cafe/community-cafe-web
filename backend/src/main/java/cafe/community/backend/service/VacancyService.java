package cafe.community.backend.service;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.VacancyRepository;
import cafe.community.backend.util.SortOrders;
import cafe.community.backend.service.audit.AuditSnapshots;
import cafe.community.backend.service.audit.Audited;
import cafe.community.backend.service.audit.Snapshot;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VacancyService {

    private final VacancyRepository repo;
    private final MediaService media;
    private final AuditService auditService;

    private static final Audited<Vacancy> VACANCY =
            new Audited<>(AuditEntityType.VACANCY, "vacancy", Vacancy::getId, Vacancy::getTitle, AuditSnapshots::of);


    public VacancyService(VacancyRepository repo, MediaService media, AuditService auditService) {
        this.repo = repo;
        this.media = media;
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
        if (req.sortOrder() == null) {
            v.setSortOrder(nextSortOrder());
        }
        Vacancy saved = repo.save(v);
        auditService.created(VACANCY, saved);
        return VacancyDto.from(saved);
    }

    public VacancyDto update(Long id, VacancyRequest req) {
        Vacancy v = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vacancy not found: " + id));
        Snapshot before = VACANCY.snapshot(v);
        apply(v, req);
        Vacancy saved = repo.save(v);
        auditService.updated(VACANCY, before, saved);
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
        auditService.deleted(VACANCY, v);
        repo.deleteById(id);
    }

    /** Where a new vacancy lands: after the last one. */
    private int nextSortOrder() {
        List<Vacancy> all = repo.findAllByOrderBySortOrderAscTitleAsc();
        return all.isEmpty() ? 0 : all.getLast().getSortOrder() + 1;
    }

    private void apply(Vacancy v, VacancyRequest req) {
        v.setTitle(req.title());
        v.setDescription(req.description());
        v.setHours(req.hours());
        v.setType(req.type());
        v.setApplyEmail(req.applyEmail());
        v.setApplyLink(req.applyLink());
        v.setBar(BarLocation.parseOrShared(req.bar()));
        v.setActive(req.active());
        // Omitting the position leaves it where it is; create appends instead.
        if (req.sortOrder() != null) {
            v.setSortOrder(req.sortOrder());
        }
        v.setImage(media.resolve(req.imageId()));
    }
}
