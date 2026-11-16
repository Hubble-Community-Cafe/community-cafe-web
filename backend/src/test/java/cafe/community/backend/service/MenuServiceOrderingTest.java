package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

/** Drag-and-drop order of tabs, categories and items, and the position given on create and update. */
class MenuServiceOrderingTest extends MenuServiceTestBase {

    // ===== Reordering =====

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
