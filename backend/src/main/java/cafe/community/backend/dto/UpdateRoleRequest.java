package cafe.community.backend.dto;

import cafe.community.backend.model.AdminRole;
import jakarta.validation.constraints.NotNull;

/** Request body to change a user's role. */
public record UpdateRoleRequest(@NotNull AdminRole role) {
}
