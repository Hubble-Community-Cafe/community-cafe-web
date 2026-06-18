package cafe.community.backend.controller;

import cafe.community.backend.dto.*;
import cafe.community.backend.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for menu categories, items, and the daily dinner dish. Requires EDITOR or ADMIN role. */
@RestController
@RequestMapping("/api/admin/menu")
@PreAuthorize("hasRole('EDITOR')")
public class AdminMenuController {

    private final MenuService menuService;

    public AdminMenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    // ===== Categories =====

    @GetMapping("/categories")
    public List<MenuCategoryDto> listCategories() {
        return menuService.getAllCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuCategoryDto createCategory(@Valid @RequestBody MenuCategoryRequest req) {
        return menuService.createCategory(req);
    }

    @PutMapping("/categories/{id}")
    public MenuCategoryDto updateCategory(@PathVariable Long id,
                                          @Valid @RequestBody MenuCategoryRequest req) {
        return menuService.updateCategory(id, req);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
    }

    // ===== Items =====

    @GetMapping("/categories/{categoryId}/items")
    public List<MenuItemDto> listItems(@PathVariable Long categoryId) {
        return menuService.getItemsForCategory(categoryId);
    }

    @PostMapping("/categories/{categoryId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemDto createItem(@PathVariable Long categoryId,
                                  @Valid @RequestBody MenuItemRequest req) {
        return menuService.createItem(categoryId, req);
    }

    @PutMapping("/items/{id}")
    public MenuItemDto updateItem(@PathVariable Long id,
                                  @Valid @RequestBody MenuItemRequest req) {
        return menuService.updateItem(id, req);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
    }

    // ===== Daily dish (Hubble only) =====

    @GetMapping("/daily-dish")
    public List<DailyDishDto> listDishes() {
        return menuService.getUpcomingDishes();
    }

    @PostMapping("/daily-dish")
    @ResponseStatus(HttpStatus.CREATED)
    public DailyDishDto createDish(@Valid @RequestBody DailyDishRequest req) {
        return menuService.createDish(req);
    }

    @PutMapping("/daily-dish/{id}")
    public DailyDishDto updateDish(@PathVariable Long id,
                                   @Valid @RequestBody DailyDishRequest req) {
        return menuService.updateDish(id, req);
    }

    @DeleteMapping("/daily-dish/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDish(@PathVariable Long id) {
        menuService.deleteDish(id);
    }
}
