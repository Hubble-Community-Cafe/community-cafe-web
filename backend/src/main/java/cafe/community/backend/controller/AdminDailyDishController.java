package cafe.community.backend.controller;

import cafe.community.backend.dto.DailyDishDto;
import cafe.community.backend.dto.DailyDishRequest;
import cafe.community.backend.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin CRUD for the Daily Dinner Dish (Hubble only). Its own module so it can be
 * delegated narrowly: reads are open to any signed-in staff (VIEWER and up), and
 * writes require the DDD_POSTER role (which EDITOR and ADMIN also satisfy).
 */
@RestController
@RequestMapping("/api/admin/daily-dish")
public class AdminDailyDishController {

    private final MenuService menuService;

    public AdminDailyDishController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<DailyDishDto> listDishes() {
        return menuService.getUpcomingDishes();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('DDD_POSTER')")
    public DailyDishDto createDish(@Valid @RequestBody DailyDishRequest req) {
        return menuService.createDish(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DDD_POSTER')")
    public DailyDishDto updateDish(@PathVariable Long id,
                                   @Valid @RequestBody DailyDishRequest req) {
        return menuService.updateDish(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('DDD_POSTER')")
    public void deleteDish(@PathVariable Long id) {
        menuService.deleteDish(id);
    }
}
