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
 * delegated narrowly: reads need Daily dish view, writes need Daily dish edit.
 */
@RestController
@PreAuthorize("hasAuthority('DAILY_DISH_VIEW')")
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
    @PreAuthorize("hasAuthority('DAILY_DISH_EDIT')")
    public DailyDishDto createDish(@Valid @RequestBody DailyDishRequest req) {
        return menuService.createDish(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DAILY_DISH_EDIT')")
    public DailyDishDto updateDish(@PathVariable Long id,
                                   @Valid @RequestBody DailyDishRequest req) {
        return menuService.updateDish(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('DAILY_DISH_EDIT')")
    public void deleteDish(@PathVariable Long id) {
        menuService.deleteDish(id);
    }
}
