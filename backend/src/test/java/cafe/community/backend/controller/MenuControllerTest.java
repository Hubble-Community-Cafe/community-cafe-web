package cafe.community.backend.controller;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
import cafe.community.backend.service.MenuService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.initial-admin-oid=menu-admin-oid")
class MenuControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired MenuService menuService;

    @Test
    void publicMenu_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/menu/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicMenu_returnsTabsWithCategoriesAndItems() throws Exception {
        MenuCategoryDto tab = menuService.createCategory(
                new MenuCategoryRequest("Drinks", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, null));
        MenuCategoryDto cat = menuService.createCategory(
                new MenuCategoryRequest("Beers", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, tab.id()));
        menuService.createItem(cat.id(), new MenuItemRequest(
                "Heineken", null, new BigDecimal("3.50"), new BigDecimal("2.80"),
                List.of("0.25L"), List.of(), List.of(), null, 1, true));

        mockMvc.perform(get("/api/menu/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Drinks"))
                .andExpect(jsonPath("$[0].categories[0].name").value("Beers"))
                .andExpect(jsonPath("$[0].categories[0].items[0].name").value("Heineken"))
                .andExpect(jsonPath("$[0].categories[0].items[0].regularPrice").value(3.50))
                .andExpect(jsonPath("$[0].categories[0].items[0].studentPrice").value(2.80));
    }

    @Test
    void todaysDishes_emptyListWhenNoneSet() throws Exception {
        mockMvc.perform(get("/api/daily-dish/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void todaysDishes_returnsAllDishesForToday() throws Exception {
        menuService.createDish(new DailyDishRequest(
                LocalDate.now(), "Lasagna", null, new BigDecimal("9.00"), null));
        menuService.createDish(new DailyDishRequest(
                LocalDate.now(), "Vegan Curry", null, new BigDecimal("8.50"), null));

        mockMvc.perform(get("/api/daily-dish/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Lasagna"))
                .andExpect(jsonPath("$[1].name").value("Vegan Curry"));
    }

    @Test
    void adminMenu_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/menu/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminMenu_allowedForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/menu/categories")
                        .with(jwt().jwt(j -> j.claim("oid", "menu-admin-oid")
                                .claim("preferred_username", "admin@hubble.cafe")
                                .claim("name", "Admin"))))
                .andExpect(status().isOk());
    }
}
