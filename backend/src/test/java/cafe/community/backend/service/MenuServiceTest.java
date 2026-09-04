package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MenuServiceTest {

    @Autowired MenuService menuService;
    @Autowired MenuCategoryRepository categoryRepo;
    @Autowired MenuItemRepository itemRepo;
    @Autowired DailyDishRepository dishRepo;
    @Autowired AuditLogRepository auditLogRepository;

    private MenuCategoryRequest hubbleBeerCategory() {
        return new MenuCategoryRequest("Beers", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, null);
    }

    private MenuItemRequest basicItem(boolean active) {
        return new MenuItemRequest("Heineken", null, new BigDecimal("3.50"),
                new BigDecimal("2.80"), List.of("0.25L", "0.5L"),
                List.of("vegan"), List.of(), null, 1, active);
    }

    @Test
    void createAndFetchCategory() {
        MenuCategoryDto dto = menuService.createCategory(hubbleBeerCategory());

        assertThat(dto.id()).isNotNull();
        assertThat(dto.name()).isEqualTo("Beers");
        assertThat(dto.kind()).isEqualTo(MenuKind.DRINK);
        assertThat(dto.bar()).isEqualTo(BarLocation.HUBBLE);

        List<MenuCategoryDto> all = menuService.getAllCategories();
        assertThat(all).extracting(MenuCategoryDto::name).contains("Beers");
    }

    @Test
    void updateCategory() {
        MenuCategoryDto created = menuService.createCategory(hubbleBeerCategory());

        MenuCategoryRequest update = new MenuCategoryRequest(
                "Craft Beers", MenuKind.DRINK, "After 17:00", 1, BarLocation.HUBBLE, null);
        MenuCategoryDto updated = menuService.updateCategory(created.id(), update);

        assertThat(updated.name()).isEqualTo("Craft Beers");
        assertThat(updated.availabilityNote()).isEqualTo("After 17:00");
    }

    @Test
    void deleteCategory() {
        MenuCategoryDto dto = menuService.createCategory(hubbleBeerCategory());
        menuService.deleteCategory(dto.id());

        assertThat(menuService.getAllCategories()).extracting(MenuCategoryDto::name)
                .doesNotContain("Beers");
    }

    @Test
    void updateCategory_unknownIdThrows() {
        assertThatThrownBy(() -> menuService.updateCategory(999L, hubbleBeerCategory()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createAndFetchItem() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto item = menuService.createItem(cat.id(), basicItem(true));

        assertThat(item.name()).isEqualTo("Heineken");
        assertThat(item.regularPrice()).isEqualByComparingTo("3.50");
        assertThat(item.studentPrice()).isEqualByComparingTo("2.80");
        assertThat(item.sizeOptions()).containsExactly("0.25L", "0.5L");
        assertThat(item.dietaryTags()).containsExactly("vegan");
        assertThat(item.allergens()).isEmpty();
        assertThat(item.active()).isTrue();
    }

    @Test
    void getMenuPage_onlyActiveItems() {
        MenuCategoryDto tab = menuService.createCategory(
                new MenuCategoryRequest("Drinks", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, null));
        MenuCategoryDto cat = menuService.createCategory(
                new MenuCategoryRequest("Beers", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        menuService.createItem(cat.id(), basicItem(true));
        menuService.createItem(cat.id(), new MenuItemRequest(
                "InactiveItem", null, new BigDecimal("5.00"),
                null, List.of(), List.of(), List.of(), null, 2, false));

        List<MenuTabDto> page = menuService.getMenuPage(BarLocation.HUBBLE);
        assertThat(page).hasSize(1);
        assertThat(page.get(0).categories()).hasSize(1);
        assertThat(page.get(0).categories().get(0).items()).hasSize(1);
        assertThat(page.get(0).categories().get(0).items().get(0).name()).isEqualTo("Heineken");
    }

    @Test
    void getMenuPage_sharedTabAppearsOnBothBars() {
        // The tab needs a visible item: tabs with nothing to show are left out of the
        // public menu so hiding never leaves an empty heading behind.
        MenuCategoryDto tab = menuService.createCategory(new MenuCategoryRequest(
                "Shared Menu", MenuKind.FOOD, null, 1, null, null));
        MenuCategoryDto cat = menuService.createCategory(new MenuCategoryRequest(
                "Snacks", MenuKind.FOOD, null, 1, null, tab.id()));
        menuService.createItem(cat.id(), basicItem(true));

        assertThat(menuService.getMenuPage(BarLocation.HUBBLE))
                .extracting(MenuTabDto::name).contains("Shared Menu");
        assertThat(menuService.getMenuPage(BarLocation.METEOR))
                .extracting(MenuTabDto::name).contains("Shared Menu");
    }

    // ===== Visibility toggles =====

    /** Builds tab > sub-heading > one visible item and returns [tab, subHeading]. */
    private MenuCategoryDto[] tabWithItem() {
        MenuCategoryDto tab = menuService.createCategory(
                new MenuCategoryRequest("Drinks", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, null));
        MenuCategoryDto cat = menuService.createCategory(
                new MenuCategoryRequest("Beers", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        menuService.createItem(cat.id(), basicItem(true));
        return new MenuCategoryDto[]{tab, cat};
    }

    @Test
    void hiddenTab_isExcludedFromPublicMenu() {
        MenuCategoryDto tab = tabWithItem()[0];
        menuService.setCategoryActive(tab.id(), false);

        assertThat(menuService.getMenuPage(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void hiddenSubHeading_isExcludedFromPublicMenu() {
        MenuCategoryDto cat = tabWithItem()[1];
        menuService.setCategoryActive(cat.id(), false);

        // The tab has nothing left to show, so it disappears too rather than leaving a heading.
        assertThat(menuService.getMenuPage(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void activeItemUnderHiddenCategory_staysHidden() {
        MenuCategoryDto[] built = tabWithItem();
        menuService.setCategoryActive(built[1].id(), false);

        // The item's own flag is untouched and still true; the category decides.
        assertThat(menuService.getItemsForCategory(built[1].id()))
                .allMatch(MenuItemDto::active);
        assertThat(menuService.getMenuPage(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void reEnablingCategory_restoresPreviousPerItemVisibility() {
        MenuCategoryDto[] built = tabWithItem();
        MenuCategoryDto cat = built[1];
        MenuItemDto hidden = menuService.createItem(cat.id(), new MenuItemRequest(
                "Sold out", null, new BigDecimal("4.00"),
                null, List.of(), List.of(), List.of(), null, 2, false));

        menuService.setCategoryActive(cat.id(), false);
        menuService.setCategoryActive(cat.id(), true);

        // Exactly what was visible before is visible again: the hidden item stays hidden.
        List<MenuItemDto> visible = menuService.getMenuPage(BarLocation.HUBBLE)
                .get(0).categories().get(0).items();
        assertThat(visible).extracting(MenuItemDto::name).containsExactly("Heineken");
        assertThat(menuService.getItemsForCategory(cat.id()))
                .filteredOn(i -> i.id().equals(hidden.id()))
                .allMatch(i -> !i.active());
    }

    @Test
    void categoryWithAllItemsHidden_leavesNoEmptyHeading() {
        MenuCategoryDto cat = tabWithItem()[1];
        MenuItemDto only = menuService.getItemsForCategory(cat.id()).get(0);
        menuService.setItemActive(only.id(), false);

        assertThat(menuService.getMenuPage(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void hiddenCategoriesAndItems_remainVisibleInAdminLists() {
        MenuCategoryDto[] built = tabWithItem();
        MenuItemDto item = menuService.getItemsForCategory(built[1].id()).get(0);
        menuService.setCategoryActive(built[1].id(), false);
        menuService.setItemActive(item.id(), false);

        assertThat(menuService.getAllCategories())
                .extracting(MenuCategoryDto::name).contains("Beers");
        assertThat(menuService.getItemsForCategory(built[1].id())).hasSize(1);
    }

    @Test
    void togglingCategory_isAuditedAsToggle() {
        MenuCategoryDto tab = tabWithItem()[0];
        menuService.setCategoryActive(tab.id(), false);

        assertThat(auditLogRepository.findAll())
                .anyMatch(a -> a.getAction() == AuditAction.TOGGLE
                        && a.getEntityType() == AuditEntityType.MENU_CATEGORY
                        && a.getSummary().contains("Hid category: Drinks"));
    }

    @Test
    void togglingItem_isAuditedAsToggle() {
        MenuCategoryDto cat = tabWithItem()[1];
        MenuItemDto item = menuService.getItemsForCategory(cat.id()).get(0);
        menuService.setItemActive(item.id(), false);

        assertThat(auditLogRepository.findAll())
                .anyMatch(a -> a.getAction() == AuditAction.TOGGLE
                        && a.getEntityType() == AuditEntityType.MENU_ITEM
                        && a.getSummary().contains("Hid item: Heineken"));
    }

    @Test
    void newCategoryWithoutFlag_isVisible() {
        assertThat(menuService.createCategory(hubbleBeerCategory()).active()).isTrue();
    }

    @Test
    void createAndFetchDailyDish() {
        DailyDishRequest req = new DailyDishRequest(
                LocalDate.now(), "Pasta Bolognese", "A classic.", new BigDecimal("8.50"), null);
        DailyDishDto dto = menuService.createDish(req);

        assertThat(dto.name()).isEqualTo("Pasta Bolognese");
        assertThat(dto.price()).isEqualByComparingTo("8.50");

        assertThat(menuService.getTodaysDishes())
                .extracting(DailyDishDto::name)
                .containsExactly("Pasta Bolognese");
    }

    @Test
    void getTodaysDishes_emptyWhenNoneSet() {
        assertThat(menuService.getTodaysDishes()).isEmpty();
    }

    @Test
    void getTodaysDishes_returnsMultipleDishesForSameDate() {
        menuService.createDish(new DailyDishRequest(LocalDate.now(), "Lasagna", null, new BigDecimal("9.49"), null));
        menuService.createDish(new DailyDishRequest(LocalDate.now(), "Vegan Curry", null, new BigDecimal("8.99"), null));

        assertThat(menuService.getTodaysDishes())
                .extracting(DailyDishDto::name)
                .containsExactly("Lasagna", "Vegan Curry");
    }

    // ===== Reordering =====

    private MenuItemRequest itemNamed(String name, int sortOrder) {
        return new MenuItemRequest(name, null, new BigDecimal("3.50"), null,
                List.of(), List.of(), List.of(), null, sortOrder, true);
    }

    private MenuCategoryRequest hubbleTab(String name, int sortOrder) {
        return new MenuCategoryRequest(name, MenuKind.DRINK, null, sortOrder, BarLocation.HUBBLE, null);
    }

    @Test
    void reorderItems_appliesTheGivenOrderAndClosesTheGaps() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto amstel = menuService.createItem(cat.id(), itemNamed("Amstel", 5));
        MenuItemDto brand = menuService.createItem(cat.id(), itemNamed("Brand", 10));
        MenuItemDto cornet = menuService.createItem(cat.id(), itemNamed("Cornet", 15));

        menuService.reorderItems(cat.id(), List.of(cornet.id(), amstel.id(), brand.id()));

        assertThat(menuService.getItemsForCategory(cat.id()))
                .extracting(MenuItemDto::name, MenuItemDto::sortOrder)
                .containsExactly(
                        tuple("Cornet", 0),
                        tuple("Amstel", 1),
                        tuple("Brand", 2));
    }

    @Test
    void reorderItems_rejectsAnOrderMissingAnItem() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto amstel = menuService.createItem(cat.id(), itemNamed("Amstel", 0));
        menuService.createItem(cat.id(), itemNamed("Brand", 1));

        assertThatThrownBy(() -> menuService.reorderItems(cat.id(), List.of(amstel.id())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match this list");
    }

    @Test
    void reorderItems_rejectsAnItemFromAnotherCategory() {
        MenuCategoryDto beers = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto wines = menuService.createCategory(hubbleTab("Wines", 2));
        MenuItemDto amstel = menuService.createItem(beers.id(), itemNamed("Amstel", 0));
        MenuItemDto merlot = menuService.createItem(wines.id(), itemNamed("Merlot", 0));

        assertThatThrownBy(() -> menuService.reorderItems(beers.id(), List.of(merlot.id(), amstel.id())))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(menuService.getItemsForCategory(wines.id()))
                .extracting(MenuItemDto::name).containsExactly("Merlot");
    }

    @Test
    void reorderItems_isAuditedAsOneEntry() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto amstel = menuService.createItem(cat.id(), itemNamed("Amstel", 0));
        MenuItemDto brand = menuService.createItem(cat.id(), itemNamed("Brand", 1));

        menuService.reorderItems(cat.id(), List.of(brand.id(), amstel.id()));

        assertThat(auditLogRepository.findAll())
                .filteredOn(a -> a.getAction() == AuditAction.REORDER)
                .singleElement()
                .satisfies(a -> {
                    assertThat(a.getEntityType()).isEqualTo(AuditEntityType.MENU_CATEGORY);
                    assertThat(a.getSummary()).isEqualTo("Reordered 2 items in Beers");
                });
    }

    @Test
    void reorderCategories_reordersTheTabsOfOneBar() {
        MenuCategoryDto beers = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto wines = menuService.createCategory(hubbleTab("Wines", 2));

        menuService.reorderCategories(new MenuCategoryReorderRequest(
                null, BarLocation.HUBBLE, List.of(wines.id(), beers.id())));

        assertThat(categoryRepo.findTopLevelForBar(BarLocation.HUBBLE))
                .extracting(MenuCategory::getName).containsExactly("Wines", "Beers");
    }

    @Test
    void reorderCategories_reordersTheSubHeadingsOfOneTab() {
        MenuCategoryDto tab = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto draft = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        MenuCategoryDto bottled = menuService.createCategory(
                new MenuCategoryRequest("Bottled", MenuKind.DRINK, null, 2, BarLocation.HUBBLE, tab.id()));

        menuService.reorderCategories(new MenuCategoryReorderRequest(
                tab.id(), null, List.of(bottled.id(), draft.id())));

        MenuCategory parent = categoryRepo.findById(tab.id()).orElseThrow();
        assertThat(categoryRepo.findByParentOrderBySortOrderAsc(parent))
                .extracting(MenuCategory::getName).containsExactly("Bottled", "Draft");
    }

    /** Sub-headings of another tab are a different list, so naming one of them is rejected. */
    @Test
    void reorderCategories_rejectsASubHeadingFromAnotherTab() {
        MenuCategoryDto beers = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto wines = menuService.createCategory(hubbleTab("Wines", 2));
        MenuCategoryDto draft = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, beers.id()));
        MenuCategoryDto red = menuService.createCategory(
                new MenuCategoryRequest("Red", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, wines.id()));

        assertThatThrownBy(() -> menuService.reorderCategories(new MenuCategoryReorderRequest(
                beers.id(), null, List.of(red.id(), draft.id()))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ===== Bulk price =====

    private MenuItemRequest pricedItem(String name, String regular, String student) {
        return new MenuItemRequest(name, null, new BigDecimal(regular),
                student == null ? null : new BigDecimal(student),
                List.of(), List.of(), List.of(), null, null, true);
    }

    @Test
    void bulkSetPrice_setsTheRegularPriceOnEveryItem() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", "6.00"));
        MenuItemDto b = menuService.createItem(cat.id(), pricedItem("Negroni", "8.00", "6.50"));
        MenuItemDto untouched = menuService.createItem(cat.id(), pricedItem("Daiquiri", "9.00", null));

        menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id(), b.id()), new BigDecimal("7.50"), null, false));

        assertThat(menuService.getItemsForCategory(cat.id()))
                .extracting(MenuItemDto::name, MenuItemDto::regularPrice, MenuItemDto::studentPrice)
                .containsExactly(
                        tuple("Mojito", new BigDecimal("7.50"), new BigDecimal("6.00")),
                        tuple("Negroni", new BigDecimal("7.50"), new BigDecimal("6.50")),
                        tuple("Daiquiri", new BigDecimal("9.00"), null));
        assertThat(untouched.id()).isNotNull();
    }

    /** Setting only the regular price must not disturb a student price someone set per item. */
    @Test
    void bulkSetPrice_leavesTheStudentPriceAloneWhenItIsNotGiven() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", "6.00"));

        List<MenuItemDto> saved = menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id()), new BigDecimal("7.50"), null, false));

        assertThat(saved).singleElement()
                .satisfies(i -> assertThat(i.studentPrice()).isEqualByComparingTo("6.00"));
    }

    @Test
    void bulkSetPrice_canSetOnlyTheStudentPrice() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", "6.00"));

        List<MenuItemDto> saved = menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id()), null, new BigDecimal("5.50"), false));

        assertThat(saved).singleElement().satisfies(i -> {
            assertThat(i.regularPrice()).isEqualByComparingTo("7.00");
            assertThat(i.studentPrice()).isEqualByComparingTo("5.50");
        });
    }

    /** A null student price means "unchanged", so removing one needs its own flag. */
    @Test
    void bulkSetPrice_clearsTheStudentPriceWhenAsked() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", "6.00"));

        List<MenuItemDto> saved = menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id()), null, null, true));

        assertThat(saved).singleElement().satisfies(i -> {
            assertThat(i.regularPrice()).isEqualByComparingTo("7.00");
            assertThat(i.studentPrice()).isNull();
        });
    }

    @Test
    void bulkSetPrice_rejectsAStudentPriceAndClearingItTogether() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", "6.00"));

        assertThatThrownBy(() -> menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id()), null, new BigDecimal("5.00"), true)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not both");
    }

    @Test
    void bulkSetPrice_rejectsARequestThatChangesNothing() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", null));

        assertThatThrownBy(() -> menuService.bulkSetPrice(
                new BulkPriceRequest(List.of(a.id()), null, null, false)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Nothing to change");
    }

    /** Half-applied is worse than refused: the editor could not tell which rows took the price. */
    @Test
    void bulkSetPrice_rejectsTheWholeBatchWhenAnItemIsGone() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", null));

        assertThatThrownBy(() -> menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id(), 999_999L), new BigDecimal("7.50"), null, false)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no longer exist");

        assertThat(menuService.getItemsForCategory(cat.id()))
                .singleElement()
                .satisfies(i -> assertThat(i.regularPrice()).isEqualByComparingTo("7.00"));
    }

    @Test
    void bulkSetPrice_auditsEachItemWithTheOldAndNewPrice() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto a = menuService.createItem(cat.id(), pricedItem("Mojito", "7.00", null));
        MenuItemDto b = menuService.createItem(cat.id(), pricedItem("Negroni", "8.00", null));

        menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(a.id(), b.id()), new BigDecimal("7.50"), null, false));

        assertThat(auditLogRepository.findAll())
                .filteredOn(e -> e.getSummary().startsWith("Bulk price update"))
                .hasSize(2)
                .anySatisfy(e -> {
                    assertThat(e.getEntityLabel()).isEqualTo("Mojito");
                    assertThat(e.getChanges()).contains("7.00").contains("7.50");
                });
    }

    /** Recording a change on an item already at the target price would make the history lie. */
    @Test
    void bulkSetPrice_doesNotAuditAnItemAlreadyAtThatPrice() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto already = menuService.createItem(cat.id(), pricedItem("Mojito", "7.50", null));
        MenuItemDto changing = menuService.createItem(cat.id(), pricedItem("Negroni", "8.00", null));

        menuService.bulkSetPrice(new BulkPriceRequest(
                List.of(already.id(), changing.id()), new BigDecimal("7.50"), null, false));

        assertThat(auditLogRepository.findAll())
                .filteredOn(e -> e.getSummary().startsWith("Bulk price update"))
                .singleElement()
                .satisfies(e -> assertThat(e.getEntityLabel()).isEqualTo("Negroni"));
    }

    // ===== Bulk move =====

    @Test
    void bulkMove_appendsToTheTargetKeepingTheItemsInOrder() {
        MenuCategoryDto tab = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto from = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        MenuCategoryDto to = menuService.createCategory(
                new MenuCategoryRequest("Bottled", MenuKind.DRINK, null, 2, BarLocation.HUBBLE, tab.id()));
        menuService.createItem(to.id(), itemNamed("Cornet", 0));
        MenuItemDto amstel = menuService.createItem(from.id(), itemNamed("Amstel", 0));
        MenuItemDto brand = menuService.createItem(from.id(), itemNamed("Brand", 1));

        menuService.bulkMove(new BulkMoveRequest(List.of(amstel.id(), brand.id()), to.id()));

        assertThat(menuService.getItemsForCategory(to.id()))
                .extracting(MenuItemDto::name, MenuItemDto::sortOrder)
                .containsExactly(tuple("Cornet", 0), tuple("Amstel", 1), tuple("Brand", 2));
        assertThat(menuService.getItemsForCategory(from.id())).isEmpty();
    }

    @Test
    void bulkMove_movesASingleMisfiledItem() {
        MenuCategoryDto tab = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto wrong = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        MenuCategoryDto right = menuService.createCategory(
                new MenuCategoryRequest("Bottled", MenuKind.DRINK, null, 2, BarLocation.HUBBLE, tab.id()));
        MenuItemDto stray = menuService.createItem(wrong.id(), itemNamed("Cornet", 0));

        List<MenuItemDto> moved = menuService.bulkMove(new BulkMoveRequest(List.of(stray.id()), right.id()));

        assertThat(moved).singleElement()
                .satisfies(i -> assertThat(i.categoryId()).isEqualTo(right.id()));
    }

    /** Selecting rows that are already there should send them to the end, not collide with it. */
    @Test
    void bulkMove_withinTheSameCategorySendsThemToTheEnd() {
        MenuCategoryDto tab = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto cat = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        MenuItemDto amstel = menuService.createItem(cat.id(), itemNamed("Amstel", 0));
        menuService.createItem(cat.id(), itemNamed("Brand", 1));
        menuService.createItem(cat.id(), itemNamed("Cornet", 2));

        menuService.bulkMove(new BulkMoveRequest(List.of(amstel.id()), cat.id()));

        assertThat(menuService.getItemsForCategory(cat.id()))
                .extracting(MenuItemDto::name, MenuItemDto::sortOrder)
                .containsExactly(tuple("Brand", 0), tuple("Cornet", 1), tuple("Amstel", 2));
    }

    @Test
    void bulkMove_refusesATabAsTheTarget() {
        MenuCategoryDto tab = menuService.createCategory(hubbleBeerCategory());
        MenuCategoryDto sub = menuService.createCategory(
                new MenuCategoryRequest("Draft", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        MenuItemDto amstel = menuService.createItem(sub.id(), itemNamed("Amstel", 0));

        assertThatThrownBy(() -> menuService.bulkMove(new BulkMoveRequest(List.of(amstel.id()), tab.id())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("sub-heading");
    }

    /** Sub-heading names repeat across tabs, so a move must be judged by id, not by name. */
    @Test
    void bulkMove_auditsAMoveBetweenTwoSectionsOfTheSameName() {
        MenuCategoryDto tabOne = menuService.createCategory(hubbleTab("Non-Alcoholic", 1));
        MenuCategoryDto tabTwo = menuService.createCategory(hubbleTab("Cocktails & More", 2));
        MenuCategoryDto from = menuService.createCategory(
                new MenuCategoryRequest("Mocktails", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tabOne.id()));
        MenuCategoryDto to = menuService.createCategory(
                new MenuCategoryRequest("Mocktails", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tabTwo.id()));
        MenuItemDto item = menuService.createItem(from.id(), itemNamed("Virgin Mojito", 0));

        menuService.bulkMove(new BulkMoveRequest(List.of(item.id()), to.id()));

        assertThat(auditLogRepository.findAll())
                .filteredOn(e -> e.getSummary().startsWith("Moved item to"))
                .singleElement()
                .satisfies(e -> assertThat(e.getEntityLabel()).isEqualTo("Virgin Mojito"));
    }

    // ===== Position on create and update =====

    @Test
    void createItem_withoutASortOrder_landsLast() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        menuService.createItem(cat.id(), itemNamed("Amstel", 4));

        MenuItemDto appended = menuService.createItem(cat.id(),
                new MenuItemRequest("Brand", null, new BigDecimal("3.50"), null,
                        List.of(), List.of(), List.of(), null, null, true));

        assertThat(appended.sortOrder()).isEqualTo(5);
        assertThat(menuService.getItemsForCategory(cat.id()))
                .extracting(MenuItemDto::name).containsExactly("Amstel", "Brand");
    }

    @Test
    void createItem_withoutASortOrder_startsAtZeroInAnEmptyCategory() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());

        MenuItemDto first = menuService.createItem(cat.id(),
                new MenuItemRequest("Amstel", null, new BigDecimal("3.50"), null,
                        List.of(), List.of(), List.of(), null, null, true));

        assertThat(first.sortOrder()).isZero();
    }

    /** Editing an item must not drag it to the bottom of its category. */
    @Test
    void updateItem_withoutASortOrder_staysPut() {
        MenuCategoryDto cat = menuService.createCategory(hubbleBeerCategory());
        MenuItemDto amstel = menuService.createItem(cat.id(), itemNamed("Amstel", 0));
        menuService.createItem(cat.id(), itemNamed("Brand", 1));

        MenuItemDto renamed = menuService.updateItem(amstel.id(),
                new MenuItemRequest("Amstel Radler", null, new BigDecimal("3.50"), null,
                        List.of(), List.of(), List.of(), null, null, true));

        assertThat(renamed.sortOrder()).isZero();
        assertThat(menuService.getItemsForCategory(cat.id()))
                .extracting(MenuItemDto::name).containsExactly("Amstel Radler", "Brand");
    }

    @Test
    void createCategory_withoutASortOrder_landsLastInItsOwnLevel() {
        menuService.createCategory(hubbleTab("Beers", 3));
        MenuCategoryDto tab = menuService.createCategory(
                new MenuCategoryRequest("Wines", MenuKind.DRINK, null, null, BarLocation.HUBBLE, null));

        MenuCategoryDto sub = menuService.createCategory(
                new MenuCategoryRequest("Red", MenuKind.DRINK, null, null, BarLocation.HUBBLE, tab.id()));

        assertThat(tab.sortOrder()).isEqualTo(4);
        assertThat(sub.sortOrder()).as("a first sub-heading starts its own numbering").isZero();
    }

    /** A shared tab sits in both bars' lists, so a new tab has to clear every tab, not just its own bar's. */
    @Test
    void createCategory_withoutASortOrder_clearsTabsOfBothBars() {
        menuService.createCategory(
                new MenuCategoryRequest("Meteor only", MenuKind.DRINK, null, 7, BarLocation.METEOR, null));

        MenuCategoryDto hubbleTab = menuService.createCategory(
                new MenuCategoryRequest("Beers", MenuKind.DRINK, null, null, BarLocation.HUBBLE, null));

        assertThat(hubbleTab.sortOrder()).isEqualTo(8);
    }

    @Test
    void reorderCategories_requiresABarWhenReorderingTabs() {
        MenuCategoryDto beers = menuService.createCategory(hubbleBeerCategory());

        assertThatThrownBy(() -> menuService.reorderCategories(
                new MenuCategoryReorderRequest(null, null, List.of(beers.id()))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("bar is required");
    }
}
