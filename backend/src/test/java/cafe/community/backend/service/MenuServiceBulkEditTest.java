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

/** Bulk price changes and bulk moves of selected menu items. */
class MenuServiceBulkEditTest extends MenuServiceTestBase {

    // ===== Bulk price =====

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
                    // Both sides at two decimals: the stored value carries the column's scale
                    // while the incoming one carries whatever the client sent.
                    assertThat(e.getChanges())
                            .contains("\"oldValue\":\"7.00\"")
                            .contains("\"newValue\":\"7.50\"");
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
}
