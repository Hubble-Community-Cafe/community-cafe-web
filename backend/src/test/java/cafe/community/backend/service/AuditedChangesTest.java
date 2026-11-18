package cafe.community.backend.service;

import cafe.community.backend.dto.AssociationRequest;
import cafe.community.backend.dto.DailyDishRequest;
import cafe.community.backend.dto.EventRequest;
import cafe.community.backend.dto.MenuCategoryRequest;
import cafe.community.backend.dto.MenuItemRequest;
import cafe.community.backend.dto.VacancyRequest;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.model.MenuKind;
import cafe.community.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

/**
 * What the audit log says for a plain create, update and delete of each kind that goes through
 * AuditService#created, #updated and #deleted. Staff read these lines, so they stay word for word.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditedChangesTest {

    @Autowired VacancyService vacancies;
    @Autowired AssociationService associations;
    @Autowired EventService events;
    @Autowired MenuService menu;
    @Autowired AuditLogRepository auditLog;

    private List<AuditLog> entries(AuditEntityType type) {
        return auditLog.findAll().stream().filter(e -> e.getEntityType() == type).toList();
    }

    private void expectCreateUpdateDelete(AuditEntityType type, Long id, String created, String updated,
                                          String updatedLabel) {
        assertThat(entries(type))
                .extracting(AuditLog::getAction, AuditLog::getEntityId, AuditLog::getEntityLabel, AuditLog::getSummary)
                .containsExactly(
                        tuple(AuditAction.CREATE, id, created.substring(created.indexOf(": ") + 2).replaceAll(" \\(.*", ""), created),
                        tuple(AuditAction.UPDATE, id, updatedLabel, updated),
                        tuple(AuditAction.DELETE, id, updatedLabel, updated.replaceFirst("^Updated", "Deleted")));
        assertThat(entries(type)).allSatisfy(e -> assertThat(e.getChanges()).isNotBlank());
    }

    @Test
    void vacancy() {
        Long id = vacancies.create(new VacancyRequest("Barista", null, null, null, null, null, null, null, true, null)).id();
        vacancies.update(id, new VacancyRequest("Head barista", null, null, null, null, null, null, null, true, null));
        vacancies.delete(id);
        expectCreateUpdateDelete(AuditEntityType.VACANCY, id,
                "Created vacancy: Barista", "Updated vacancy: Head barista", "Head barista");
    }

    @Test
    void association() {
        Long id = associations.create(new AssociationRequest("Doppio", null, null)).id();
        associations.update(id, new AssociationRequest("Doppio Espresso", null, null));
        associations.delete(id);
        expectCreateUpdateDelete(AuditEntityType.ASSOCIATION, id,
                "Created association: Doppio", "Updated association: Doppio Espresso", "Doppio Espresso");
    }

    @Test
    void event_namesTheBarAndDate() {
        LocalDate date = LocalDate.of(2030, 1, 10);
        Long id = events.create(new EventRequest("HUBBLE", "Quiz", null, date, null, null, null, null, true)).id();
        events.update(id, new EventRequest("HUBBLE", "Pub quiz", null, date, null, null, null, null, true));
        events.delete(id);
        expectCreateUpdateDelete(AuditEntityType.EVENT, id,
                "Created event: Quiz (HUBBLE, 2030-01-10)", "Updated event: Pub quiz (HUBBLE, 2030-01-10)", "Pub quiz");
    }

    @Test
    void menuCategoryItemAndDailyDish() {
        Long categoryId = menu.createCategory(new MenuCategoryRequest("Drinks", MenuKind.DRINK, null, null, null, null)).id();
        menu.updateCategory(categoryId, new MenuCategoryRequest("Cold drinks", MenuKind.DRINK, null, null, null, null));

        Long itemId = menu.createItem(categoryId, new MenuItemRequest("Cola", null, new BigDecimal("2.50"), null,
                List.of(), List.of(), List.of(), null, null, true)).id();
        menu.updateItem(itemId, new MenuItemRequest("Cola zero", null, new BigDecimal("2.50"), null,
                List.of(), List.of(), List.of(), null, null, true));
        menu.deleteItem(itemId);
        menu.deleteCategory(categoryId);

        Long dishId = menu.createDish(new DailyDishRequest(LocalDate.of(2030, 1, 10), "Pasta", null, null, null)).id();
        menu.updateDish(dishId, new DailyDishRequest(LocalDate.of(2030, 1, 10), "Pasta pesto", null, null, null));
        menu.deleteDish(dishId);

        expectCreateUpdateDelete(AuditEntityType.MENU_CATEGORY, categoryId,
                "Created category: Drinks", "Updated category: Cold drinks", "Cold drinks");
        expectCreateUpdateDelete(AuditEntityType.MENU_ITEM, itemId,
                "Created item: Cola", "Updated item: Cola zero", "Cola zero");
        expectCreateUpdateDelete(AuditEntityType.DAILY_DISH, dishId,
                "Created daily dish: Pasta", "Updated daily dish: Pasta pesto", "Pasta pesto");
    }
}
