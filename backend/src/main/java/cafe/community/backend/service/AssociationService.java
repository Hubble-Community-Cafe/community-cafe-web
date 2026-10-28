package cafe.community.backend.service;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.AssociationRepository;
import cafe.community.backend.repository.MediaAssetRepository;
import cafe.community.backend.service.audit.AuditSnapshots;
import cafe.community.backend.service.audit.Snapshot;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AssociationService {

    private final AssociationRepository repo;
    private final MediaAssetRepository mediaRepo;
    private final AuditService auditService;

    public AssociationService(AssociationRepository repo, MediaAssetRepository mediaRepo, AuditService auditService) {
        this.repo = repo;
        this.mediaRepo = mediaRepo;
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
        auditService.recordCreate(AuditEntityType.ASSOCIATION, saved.getId(), saved.getName(),
                AuditSnapshots.of(saved).asCreated(), "Created association: " + saved.getName());
        return AssociationDto.from(saved);
    }

    public AssociationDto update(Long id, AssociationRequest req) {
        Association a = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Association not found: " + id));
        Snapshot before = AuditSnapshots.of(a);
        apply(a, req);
        Association saved = repo.save(a);
        auditService.recordUpdate(AuditEntityType.ASSOCIATION, saved.getId(), saved.getName(),
                before.changesTo(AuditSnapshots.of(saved)), "Updated association: " + saved.getName());
        return AssociationDto.from(saved);
    }

    public void delete(Long id) {
        Association a = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Association not found: " + id));
        String name = a.getName();
        Snapshot lastValues = AuditSnapshots.of(a);
        repo.deleteById(id);
        auditService.recordDelete(AuditEntityType.ASSOCIATION, id, name, lastValues.asDeleted(),
                "Deleted association: " + name);
    }

    private void apply(Association a, AssociationRequest req) {
        a.setName(req.name());
        a.setBar(req.bar() != null && !req.bar().isBlank() ? BarLocation.valueOf(req.bar()) : null);
        MediaAsset logo = req.logoId() != null
                ? mediaRepo.findById(req.logoId()).orElse(null) : null;
        a.setLogo(logo);
    }
}
