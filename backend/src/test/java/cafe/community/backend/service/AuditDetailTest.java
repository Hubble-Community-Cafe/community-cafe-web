package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.AuditLog;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.MenuKind;
import cafe.community.backend.repository.AuditLogRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Every module records exactly what changed: the fields of what was added, old to new on an
 * edit (nothing when nothing changed), and the last values of what was deleted.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditDetailTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired MenuService menuService;
    @Autowired EventService eventService;
    @Autowired VacancyService vacancyService;
    @Autowired AssociationService associationService;
    @Autowired BoardService boardService;
    @Autowired OpeningHoursService openingHoursService;
    @Autowired AuditLogRepository auditLogRepository;

    @BeforeEach
    void clean() {
        auditLogRepository.deleteAll();
    }

    private long subCategory() {
        long tab = menuService.createCategory(
                new MenuCategoryRequest("Drinks", MenuKind.DRINK, null, null, BarLocation.HUBBLE, null, true)).id();
        return menuService.createCategory(
                new MenuCategoryRequest("Cocktails", MenuKind.DRINK, null, null, BarLocation.HUBBLE, tab, true)).id();
    }

    private static MenuItemRequest mojito(String price, String description) {
        return new MenuItemRequest("Mojito", description, new BigDecimal(price), null,
                List.of(), List.of(), List.of(), null, null, true);
    }

    /** The field changes of the newest entry with this action on this kind of content. */
    private List<FieldChange> changes(AuditEntityType type, AuditAction action) throws Exception {
        AuditLog entry = auditLogRepository.findAll().stream()
                .filter(a -> a.getEntityType() == type && a.getAction() == action)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new AssertionError("no " + action + " entry for " + type));
        return entry.getChanges() == null ? List.of()
                : JSON.readValue(entry.getChanges(), new TypeReference<List<FieldChange>>() { });
    }

    private long count(AuditEntityType type, AuditAction action) {
        return auditLogRepository.findAll().stream()
                .filter(a -> a.getEntityType() == type && a.getAction() == action).count();
    }

    @Test
    void menuItem_editRecordsOldAndNewPriceAndDescription() throws Exception {
        long id = menuService.createItem(subCategory(), mojito("7.00", "With lime")).id();

        menuService.updateItem(id, mojito("7.5", "With lime and mint"));

        assertThat(changes(AuditEntityType.MENU_ITEM, AuditAction.UPDATE)).containsExactly(
                new FieldChange("Description", "With lime", "With lime and mint"),
                new FieldChange("Regular price", "7.00", "7.50"));
    }

    @Test
    void menuItem_saveWithoutChangesAddsNoEntry() {
        long id = menuService.createItem(subCategory(), mojito("7.00", null)).id();

        menuService.updateItem(id, mojito("7.00", null));

        assertThat(count(AuditEntityType.MENU_ITEM, AuditAction.UPDATE)).isZero();
    }

    @Test
    void menuItem_createAndDeleteKeepTheFields() throws Exception {
        long id = menuService.createItem(subCategory(), mojito("7.00", null)).id();
        assertThat(changes(AuditEntityType.MENU_ITEM, AuditAction.CREATE)).contains(
                new FieldChange("Name", null, "Mojito"),
                new FieldChange("Category", null, "Cocktails"),
                new FieldChange("Regular price", null, "7.00"),
                new FieldChange("Visible", null, "Yes"));

        menuService.deleteItem(id);

        assertThat(changes(AuditEntityType.MENU_ITEM, AuditAction.DELETE)).contains(
                new FieldChange("Name", "Mojito", null),
                new FieldChange("Regular price", "7.00", null));
    }

    @Test
    void menuCategory_editRecordsTheRename() throws Exception {
        long id = subCategory();
        long tab = menuService.getAllCategories().stream().filter(c -> c.name().equals("Drinks")).findFirst()
                .orElseThrow().id();

        menuService.updateCategory(id,
                new MenuCategoryRequest("Mocktails", MenuKind.DRINK, null, null, BarLocation.HUBBLE, tab, true));

        assertThat(changes(AuditEntityType.MENU_CATEGORY, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Name", "Cocktails", "Mocktails"));
    }

    @Test
    void dailyDish_editRecordsThePrice() throws Exception {
        LocalDate date = LocalDate.of(2030, 1, 7);
        long id = menuService.createDish(new DailyDishRequest(date, "Lasagne", null, new BigDecimal("9.50"), null)).id();

        menuService.updateDish(id, new DailyDishRequest(date, "Lasagne", null, new BigDecimal("10"), null));

        assertThat(changes(AuditEntityType.DAILY_DISH, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Price", "9.50", "10.00"));
    }

    @Test
    void event_editRecordsDateTimeAndPublishing() throws Exception {
        long id = eventService.create(new EventRequest("HUBBLE", "Quiz", null, LocalDate.of(2030, 3, 1),
                "20:00", null, null, null, true)).id();

        eventService.update(id, new EventRequest("HUBBLE", "Quiz", null, LocalDate.of(2030, 3, 8),
                "20:30", null, null, null, false));

        assertThat(changes(AuditEntityType.EVENT, AuditAction.UPDATE)).containsExactly(
                new FieldChange("Date", "2030-03-01", "2030-03-08"),
                new FieldChange("Start time", "20:00", "20:30"),
                new FieldChange("Published", "Yes", "No"));
    }

    @Test
    void vacancy_editAndDelete() throws Exception {
        long id = vacancyService.create(new VacancyRequest("Bartender", null, "8h", null, null, null, null,
                "HUBBLE", true, null)).id();

        vacancyService.update(id, new VacancyRequest("Bartender", null, "12h", null, null, null, null,
                null, true, null));
        assertThat(changes(AuditEntityType.VACANCY, AuditAction.UPDATE)).containsExactly(
                new FieldChange("Bar", "Hubble", "Both"),
                new FieldChange("Hours", "8h", "12h"));

        vacancyService.delete(id);
        assertThat(changes(AuditEntityType.VACANCY, AuditAction.DELETE))
                .contains(new FieldChange("Title", "Bartender", null));
    }

    @Test
    void association_editRecordsTheName() throws Exception {
        long id = associationService.create(new AssociationRequest("Inter Actief", null, "HUBBLE")).id();

        associationService.update(id, new AssociationRequest("Inter-Actief", null, "HUBBLE"));

        assertThat(changes(AuditEntityType.ASSOCIATION, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Name", "Inter Actief", "Inter-Actief"));
    }

    @Test
    void board_termAndMemberEdits() throws Exception {
        long term = boardService.createTerm(new BoardTermRequest("Board 2030", "EXECUTIVE", null, false,
                null, null, null)).id();
        boardService.updateTerm(term, new BoardTermRequest("Board 2030", "EXECUTIVE", null, true,
                null, null, "Photo: Sam"));
        assertThat(changes(AuditEntityType.BOARD_TERM, AuditAction.UPDATE)).containsExactly(
                new FieldChange("Current board", "No", "Yes"),
                new FieldChange("Photo credit", null, "Photo: Sam"));

        long member = boardService.createMember(term, new BoardMemberRequest("Alex", "Chair", null, null)).id();
        boardService.updateMember(member, new BoardMemberRequest("Alex", "Treasurer", null, null));
        assertThat(changes(AuditEntityType.BOARD_MEMBER, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Role", "Chair", "Treasurer"));
    }

    @Test
    void weeklyHours_editAndClose() throws Exception {
        openingHoursService.upsertDay(BarLocation.METEOR, DayOfWeek.FRIDAY,
                new WeeklyHoursRequest("16:00", "23:00", null, null));
        assertThat(changes(AuditEntityType.OPENING_HOURS, AuditAction.CREATE)).containsExactly(
                new FieldChange("Open", null, "16:00"),
                new FieldChange("Close", null, "23:00"));

        openingHoursService.upsertDay(BarLocation.METEOR, DayOfWeek.FRIDAY,
                new WeeklyHoursRequest("16:00", "01:00", null, null));
        assertThat(changes(AuditEntityType.OPENING_HOURS, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Close", "23:00", "01:00"));

        openingHoursService.closeDay(BarLocation.METEOR, DayOfWeek.FRIDAY);
        assertThat(changes(AuditEntityType.OPENING_HOURS, AuditAction.DELETE))
                .contains(new FieldChange("Open", "16:00", null));
    }

    @Test
    void dateOverride_editRecordsTheStatus() throws Exception {
        LocalDate date = LocalDate.now().plusDays(10);
        long id = openingHoursService.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(date, true, null, null, "Cleaning")).id();

        openingHoursService.updateOverride(id, new HoursOverrideRequest(date, false, "12:00", "18:00", "Cleaning"));

        assertThat(changes(AuditEntityType.HOURS_OVERRIDE, AuditAction.UPDATE))
                .containsExactly(new FieldChange("Status", "Closed", "Open 12:00 to 18:00"));
    }
}
