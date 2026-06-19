package cafe.community.backend.service;

import cafe.community.backend.dto.AssociationDto;
import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.AssociationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AssociationServiceTest {

    @Autowired AssociationService service;
    @Autowired AssociationRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private AssociationRequest req(String name, String bar) {
        return new AssociationRequest(name, null, bar);
    }

    @Test
    void create_and_getAll() {
        service.create(req("Inter Actief", "HUBBLE"));
        List<AssociationDto> all = service.getAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).name()).isEqualTo("Inter Actief");
    }

    @Test
    void getAll_sortedAlphabetically() {
        service.create(req("Zeus", "HUBBLE"));
        service.create(req("Alpha", "HUBBLE"));

        List<AssociationDto> all = service.getAll();
        assertThat(all).extracting(AssociationDto::name)
                .containsExactly("Alpha", "Zeus");
    }

    @Test
    void getForBar_includesSharedAssociations() {
        service.create(req("Hubble Only", "HUBBLE"));
        service.create(req("Both", null));

        assertThat(service.getForBar(BarLocation.HUBBLE)).hasSize(2);
        assertThat(service.getForBar(BarLocation.METEOR)).hasSize(1)
                .extracting(AssociationDto::name).containsExactly("Both");
    }

    @Test
    void getForBar_isolatedByBar() {
        service.create(req("Hubble Assoc", "HUBBLE"));
        service.create(req("Meteor Assoc", "METEOR"));

        assertThat(service.getForBar(BarLocation.HUBBLE))
                .extracting(AssociationDto::name).containsExactly("Hubble Assoc");
        assertThat(service.getForBar(BarLocation.METEOR))
                .extracting(AssociationDto::name).containsExactly("Meteor Assoc");
    }

    @Test
    void update_changesName() {
        AssociationDto created = service.create(req("Old Name", "HUBBLE"));
        AssociationDto updated = service.update(created.id(), req("New Name", "HUBBLE"));
        assertThat(updated.name()).isEqualTo("New Name");
    }

    @Test
    void delete_removesAssociation() {
        AssociationDto created = service.create(req("To Delete", "HUBBLE"));
        service.delete(created.id());
        assertThat(repo.existsById(created.id())).isFalse();
    }
}
