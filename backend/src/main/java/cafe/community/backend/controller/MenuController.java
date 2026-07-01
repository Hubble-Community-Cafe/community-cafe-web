package cafe.community.backend.controller;

import cafe.community.backend.dto.DailyDishDto;
import cafe.community.backend.dto.MenuTabDto;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.service.AnalyticsService;
import cafe.community.backend.service.MenuService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public, unauthenticated menu endpoints consumed by both public sites. */
@RestController
@RequestMapping("/api")
public class MenuController {

    private final MenuService menuService;
    private final AnalyticsService analytics;

    public MenuController(MenuService menuService, AnalyticsService analytics) {
        this.menuService = menuService;
        this.analytics = analytics;
    }

    /**
     * Full menu for a bar: categories (bar-specific + shared) with their active items.
     * Path values match the {@link BarLocation} enum names.
     */
    @GetMapping("/menu/{bar}")
    public List<MenuTabDto> menu(@PathVariable BarLocation bar, HttpServletRequest request) {
        analytics.logPageView("menu", request, bar);
        return menuService.getMenuPage(bar);
    }

    /** Today's daily dinner dishes for Hubble (empty list when none are set). */
    @GetMapping("/daily-dish/today")
    public List<DailyDishDto> todaysDishes(HttpServletRequest request) {
        // Daily dish is Hubble-only content, so Hubble is the sensible fallback when no Origin.
        analytics.logPageView("daily_dish", request, BarLocation.HUBBLE);
        return menuService.getTodaysDishes();
    }
}
