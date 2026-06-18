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
        menuService.createCategory(new MenuCategoryRequest(
                "Shared Menu", MenuKind.FOOD, null, 1, null, null));

        assertThat(menuService.getMenuPage(BarLocation.HUBBLE))
                .extracting(MenuTabDto::name).contains("Shared Menu");
        assertThat(menuService.getMenuPage(BarLocation.METEOR))
                .extracting(MenuTabDto::name).contains("Shared Menu");
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
