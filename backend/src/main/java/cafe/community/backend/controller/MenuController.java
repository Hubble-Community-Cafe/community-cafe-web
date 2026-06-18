package cafe.community.backend.controller;

import cafe.community.backend.dto.DailyDishDto;
import cafe.community.backend.dto.MenuCategoryWithItemsDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public, unauthenticated menu endpoints consumed by both public sites. */
@RestController
@RequestMapping("/api")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /**
     * Full menu for a bar: categories (bar-specific + shared) with their active items.
     * Path values match the {@link BarLocation} enum names.
     */
    @GetMapping("/menu/{bar}")
    public List<MenuCategoryWithItemsDto> menu(@PathVariable BarLocation bar) {
        return menuService.getMenuPage(bar);
    }

    /** Today's daily dinner dish for Hubble, or 404 when none is set. */
    @GetMapping("/daily-dish/today")
    public ResponseEntity<DailyDishDto> todaysDish() {
        return menuService.getTodaysDish()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
