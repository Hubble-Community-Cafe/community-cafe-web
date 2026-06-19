package cafe.community.backend.service;

import cafe.community.backend.dto.VacancyDto;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.VacancyRepository;
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
class VacancyServiceTest {

    @Autowired VacancyService service;
    @Autowired VacancyRepository repo;

    @BeforeEach
    void clean() {
        repo.deleteAll();
    }

    private VacancyRequest req(String title, String bar, boolean active) {
        return new VacancyRequest(title, null, null, null, null, null, null, bar, active, 0);
    }

    @Test
    void create_and_getAll() {
        service.create(req("Manager", "HUBBLE", true));
        assertThat(service.getAll()).hasSize(1);
        assertThat(service.getAll().get(0).title()).isEqualTo("Manager");
    }

    @Test
    void getActive_returnsOnlyActive() {
        service.create(req("Manager", "HUBBLE", true));
        service.create(req("Chef", "HUBBLE", false));

        List<VacancyDto> active = service.getActive(BarLocation.HUBBLE);
        assertThat(active).hasSize(1);
        assertThat(active.get(0).title()).isEqualTo("Manager");
    }

    @Test
    void getActive_includesSharedVacancies() {
        service.create(req("Manager", "HUBBLE", true));
        service.create(req("Chef", null, true));

        assertThat(service.getActive(BarLocation.HUBBLE)).hasSize(2);
        assertThat(service.getActive(BarLocation.METEOR)).hasSize(1)
                .extracting(VacancyDto::title).containsExactly("Chef");
    }

    @Test
    void getActive_isolatedByBar() {
        service.create(req("Hubble Manager", "HUBBLE", true));
        service.create(req("Meteor Manager", "METEOR", true));

        assertThat(service.getActive(BarLocation.HUBBLE))
                .extracting(VacancyDto::title).containsExactly("Hubble Manager");
        assertThat(service.getActive(BarLocation.METEOR))
                .extracting(VacancyDto::title).containsExactly("Meteor Manager");
    }

    @Test
    void update_changesFields() {
        VacancyDto created = service.create(req("Manager", "HUBBLE", true));
        VacancyDto updated = service.update(created.id(),
                new VacancyRequest("Senior Manager", "Updated role", "15 hrs/week",
                        "Paid", null, null, null, "HUBBLE", true, 1));

        assertThat(updated.title()).isEqualTo("Senior Manager");
        assertThat(updated.description()).isEqualTo("Updated role");
        assertThat(updated.hours()).isEqualTo("15 hrs/week");
        assertThat(updated.sortOrder()).isEqualTo(1);
    }

    @Test
    void delete_removesVacancy() {
        VacancyDto created = service.create(req("To Delete", "HUBBLE", true));
        service.delete(created.id());
        assertThat(repo.existsById(created.id())).isFalse();
    }
}
