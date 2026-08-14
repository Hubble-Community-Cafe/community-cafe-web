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
}
