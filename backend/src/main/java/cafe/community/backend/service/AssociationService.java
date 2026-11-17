package cafe.community.backend.service;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.AssociationRepository;
import cafe.community.backend.service.audit.AuditSnapshots;
import cafe.community.backend.service.audit.Audited;
import cafe.community.backend.service.audit.Snapshot;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AssociationService {

    private final AssociationRepository repo;
    private final MediaService media;
    private final AuditService auditService;

    private static final Audited<Association> ASSOCIATION =
            new Audited<>(AuditEntityType.ASSOCIATION, "association", Association::getId, Association::getName,
                    AuditSnapshots::of);


    public AssociationService(AssociationRepository repo, MediaService media, AuditService auditService) {
        this.repo = repo;
        this.media = media;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AssociationDto> getForBar(BarLocation bar) {
        return repo.findForBar(bar).stream().map(AssociationDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AssociationDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream().map(AssociationDto::from).toList();
    }

    public AssociationDto create(AssociationRequest req) {
        Association a = new Association();
        apply(a, req);
        Association saved = repo.save(a);
        auditService.created(ASSOCIATION, saved);
        return AssociationDto.from(saved);
    }

    public AssociationDto update(Long id, AssociationRequest req) {
        Association a = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Association not found: " + id));
        Snapshot before = ASSOCIATION.snapshot(a);
        apply(a, req);
        Association saved = repo.save(a);
        auditService.updated(ASSOCIATION, before, saved);
        return AssociationDto.from(saved);
    }

    public void delete(Long id) {
        Association a = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Association not found: " + id));
        auditService.deleted(ASSOCIATION, a);
        repo.deleteById(id);
    }

    private void apply(Association a, AssociationRequest req) {
        a.setName(req.name());
        a.setBar(BarLocation.parseOrShared(req.bar()));
        a.setLogo(media.resolve(req.logoId()));
    }
}
