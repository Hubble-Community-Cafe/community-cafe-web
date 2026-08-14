package cafe.community.backend.controller;

import cafe.community.backend.dto.*;
import cafe.community.backend.service.MenuService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin CRUD for menu categories and items. Reads are open to any signed-in
 * staff (VIEWER and up); writes require EDITOR. The daily dinner dish lives in
 * its own module ({@link AdminDailyDishController}).
 */
@RestController
@RequestMapping("/api/admin/menu")
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
    @PreAuthorize("hasRole('EDITOR')")
    public MenuCategoryDto createCategory(@Valid @RequestBody MenuCategoryRequest req) {
        return menuService.createCategory(req);
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('EDITOR')")
    public MenuCategoryDto updateCategory(@PathVariable Long id,
                                          @Valid @RequestBody MenuCategoryRequest req) {
        return menuService.updateCategory(id, req);
    }

    /** Show or hide a category (and everything under it) on the public site. */
    @PatchMapping("/categories/{id}/active")
    @PreAuthorize("hasRole('EDITOR')")
    public MenuCategoryDto setCategoryActive(@PathVariable Long id,
                                             @Valid @RequestBody ActiveRequest req) {
        return menuService.setCategoryActive(id, req.active());
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
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
    @PreAuthorize("hasRole('EDITOR')")
    public MenuItemDto createItem(@PathVariable Long categoryId,
                                  @Valid @RequestBody MenuItemRequest req) {
        return menuService.createItem(categoryId, req);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasRole('EDITOR')")
    public MenuItemDto updateItem(@PathVariable Long id,
                                  @Valid @RequestBody MenuItemRequest req) {
        return menuService.updateItem(id, req);
    }

    /** Show or hide a single item on the public site. */
    @PatchMapping("/items/{id}/active")
    @PreAuthorize("hasRole('EDITOR')")
    public MenuItemDto setItemActive(@PathVariable Long id,
                                     @Valid @RequestBody ActiveRequest req) {
        return menuService.setItemActive(id, req.active());
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EDITOR')")
    public void deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
    }

    /** Body of the visibility toggle endpoints. */
    public record ActiveRequest(@NotNull Boolean active) {}
}
