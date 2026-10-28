package cafe.community.backend.controller;

import cafe.community.backend.dto.AdminUserDto;
import cafe.community.backend.dto.UpdateAccessRequest;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.service.AdminUserService;
import cafe.community.backend.util.AuditActorResolver;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Staff/board user management. The current user is provisioned by the role filter. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /** The signed-in user's own profile, role and access. */
    @GetMapping("/me")
    public ResponseEntity<AdminUserDto> me() {
        String oid = AuditActorResolver.resolveCurrentActor().oid();
        AdminUser user = oid == null ? null : adminUserService.getCurrentUser(oid);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(AdminUserDto.from(user));
    }

    /** List all staff/board users (admin only). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminUserDto> list() {
        return adminUserService.getAllUsers().stream().map(AdminUserDto::from).toList();
    }

    /** Set a user's admin switch and per-tab access (admin only). */
    @PutMapping("/{id}/access")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserDto updateAccess(@PathVariable Long id, @Valid @RequestBody UpdateAccessRequest request) {
        String requesterOid = AuditActorResolver.resolveCurrentActor().oid();
        return AdminUserDto.from(
                adminUserService.updateAccess(id, request.admin(), request.permissions(), requesterOid));
    }
}
