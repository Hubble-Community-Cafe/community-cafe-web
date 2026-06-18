package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
import cafe.community.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MenuService {

    private final MenuCategoryRepository categoryRepo;
    private final MenuItemRepository itemRepo;
    private final DailyDishRepository dishRepo;
    private final MediaAssetRepository mediaRepo;
    private final AuditService auditService;

    public MenuService(
            MenuCategoryRepository categoryRepo,
            MenuItemRepository itemRepo,
            DailyDishRepository dishRepo,
            MediaAssetRepository mediaRepo,
            AuditService auditService) {
        this.categoryRepo = categoryRepo;
        this.itemRepo = itemRepo;
        this.dishRepo = dishRepo;
        this.mediaRepo = mediaRepo;
        this.auditService = auditService;
    }

    // ===== Public =====

    @Transactional(readOnly = true)
    public List<MenuCategoryWithItemsDto> getMenuPage(BarLocation bar) {
        return categoryRepo.findForBar(bar).stream()
                .map(cat -> {
                    List<MenuItemDto> items = itemRepo
                            .findByCategoryAndActiveOrderBySortOrderAsc(cat, true)
                            .stream().map(MenuItemDto::from).toList();
                    return MenuCategoryWithItemsDto.from(cat, items);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<DailyDishDto> getTodaysDish() {
        return dishRepo.findByDate(LocalDate.now()).map(DailyDishDto::from);
    }

    // ===== Admin: categories =====

    @Transactional(readOnly = true)
    public List<MenuCategoryDto> getAllCategories() {
        return categoryRepo.findAllByOrderBySortOrderAsc().stream()
                .map(MenuCategoryDto::from).toList();
    }

    public MenuCategoryDto createCategory(MenuCategoryRequest req) {
        MenuCategory cat = new MenuCategory();
        applyCategory(cat, req);
        MenuCategory saved = categoryRepo.save(cat);
        auditService.recordCreate(AuditEntityType.MENU_CATEGORY, saved.getId(), saved.getName(),
                List.of(), "Created category: " + saved.getName());
        return MenuCategoryDto.from(saved);
    }

    public MenuCategoryDto updateCategory(Long id, MenuCategoryRequest req) {
        MenuCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        applyCategory(cat, req);
        MenuCategory saved = categoryRepo.save(cat);
        auditService.recordAction(AuditEntityType.MENU_CATEGORY, saved.getId(), saved.getName(),
                AuditAction.UPDATE, List.of(), "Updated category: " + saved.getName());
        return MenuCategoryDto.from(saved);
    }

    public void deleteCategory(Long id) {
        MenuCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        categoryRepo.delete(cat);
        auditService.recordDelete(AuditEntityType.MENU_CATEGORY, id, cat.getName(),
                "Deleted category: " + cat.getName());
    }

    // ===== Admin: items =====

    @Transactional(readOnly = true)
    public List<MenuItemDto> getItemsForCategory(Long categoryId) {
        return itemRepo.findByCategoryIdOrderBySortOrderAsc(categoryId)
                .stream().map(MenuItemDto::from).toList();
    }

    public MenuItemDto createItem(Long categoryId, MenuItemRequest req) {
        MenuCategory cat = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        MenuItem item = new MenuItem();
        item.setCategory(cat);
        applyItem(item, req);
        MenuItem saved = itemRepo.save(item);
        auditService.recordCreate(AuditEntityType.MENU_ITEM, saved.getId(), saved.getName(),
                List.of(), "Created item: " + saved.getName());
        return MenuItemDto.from(saved);
    }

    public MenuItemDto updateItem(Long id, MenuItemRequest req) {
        MenuItem item = itemRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        applyItem(item, req);
        MenuItem saved = itemRepo.save(item);
        auditService.recordAction(AuditEntityType.MENU_ITEM, saved.getId(), saved.getName(),
                AuditAction.UPDATE, List.of(), "Updated item: " + saved.getName());
        return MenuItemDto.from(saved);
    }

    public void deleteItem(Long id) {
        MenuItem item = itemRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        itemRepo.delete(item);
        auditService.recordDelete(AuditEntityType.MENU_ITEM, id, item.getName(),
                "Deleted item: " + item.getName());
    }

    // ===== Admin: daily dish =====

    @Transactional(readOnly = true)
    public List<DailyDishDto> getUpcomingDishes() {
        return dishRepo.findByDateGreaterThanEqualOrderByDateAsc(LocalDate.now().minusDays(1))
                .stream().map(DailyDishDto::from).toList();
    }

    public DailyDishDto createDish(DailyDishRequest req) {
        DailyDish dish = new DailyDish();
        applyDish(dish, req);
        DailyDish saved = dishRepo.save(dish);
        auditService.recordCreate(AuditEntityType.DAILY_DISH, saved.getId(), saved.getName(),
                List.of(), "Created daily dish: " + saved.getName());
        return DailyDishDto.from(saved);
    }

    public DailyDishDto updateDish(Long id, DailyDishRequest req) {
        DailyDish dish = dishRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Daily dish not found: " + id));
        applyDish(dish, req);
        DailyDish saved = dishRepo.save(dish);
        auditService.recordAction(AuditEntityType.DAILY_DISH, saved.getId(), saved.getName(),
                AuditAction.UPDATE, List.of(), "Updated daily dish: " + saved.getName());
        return DailyDishDto.from(saved);
    }

    public void deleteDish(Long id) {
        DailyDish dish = dishRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Daily dish not found: " + id));
        dishRepo.delete(dish);
        auditService.recordDelete(AuditEntityType.DAILY_DISH, id, dish.getName(),
                "Deleted daily dish: " + dish.getName());
    }

    // ===== Helpers =====

    private void applyCategory(MenuCategory cat, MenuCategoryRequest req) {
        cat.setName(req.name());
        cat.setKind(req.kind());
        cat.setAvailabilityNote(req.availabilityNote());
        cat.setSortOrder(req.sortOrder());
        cat.setBar(req.bar());
    }

    private void applyItem(MenuItem item, MenuItemRequest req) {
        item.setName(req.name());
        item.setDescription(req.description());
        item.setRegularPrice(req.regularPrice());
        item.setStudentPrice(req.studentPrice());
        item.setSizeOptions(joinCsv(req.sizeOptions()));
        item.setDietaryTags(joinCsv(req.dietaryTags()));
        item.setAllergens(joinCsv(req.allergens()));
        item.setSortOrder(req.sortOrder());
        item.setActive(req.active());
        if (req.imageId() != null) {
            item.setImage(mediaRepo.findById(req.imageId()).orElse(null));
        } else {
            item.setImage(null);
        }
    }

    private void applyDish(DailyDish dish, DailyDishRequest req) {
        dish.setDate(req.date());
        dish.setName(req.name());
        dish.setDescription(req.description());
        dish.setPrice(req.price());
        if (req.imageId() != null) {
            dish.setImage(mediaRepo.findById(req.imageId()).orElse(null));
        } else {
            dish.setImage(null);
        }
    }

    private static String joinCsv(List<String> values) {
        if (values == null || values.isEmpty()) return "";
        return String.join(",", values);
    }
}
