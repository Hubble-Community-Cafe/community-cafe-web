package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Shared set-up for the MenuService tests, which are split by area (basics and visibility,
 * ordering, bulk edits) to keep each file readable. One Spring context serves all of them.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
abstract class MenuServiceTestBase {

    @Autowired MenuService menuService;
    @Autowired MenuCategoryRepository categoryRepo;
    @Autowired MenuItemRepository itemRepo;
    @Autowired AuditLogRepository auditLogRepository;

    MenuCategoryRequest hubbleBeerCategory() {
        return new MenuCategoryRequest("Beers", MenuKind.DRINK, null, 1, BarLocation.HUBBLE, null);
    }

    MenuItemRequest basicItem(boolean active) {
        return new MenuItemRequest("Heineken", null, new BigDecimal("3.50"),
                new BigDecimal("2.80"), List.of("0.25L", "0.5L"),
                List.of("vegan"), List.of(), null, 1, active);
    }

    MenuItemRequest itemNamed(String name, int sortOrder) {
        return new MenuItemRequest(name, null, new BigDecimal("3.50"), null,
                List.of(), List.of(), List.of(), null, sortOrder, true);
    }

    MenuCategoryRequest hubbleTab(String name, int sortOrder) {
        return new MenuCategoryRequest(name, MenuKind.DRINK, null, sortOrder, BarLocation.HUBBLE, null);
    }

    MenuItemRequest pricedItem(String name, String regular, String student) {
        return new MenuItemRequest(name, null, new BigDecimal(regular),
                student == null ? null : new BigDecimal(student),
                List.of(), List.of(), List.of(), null, null, true);
    }
}
