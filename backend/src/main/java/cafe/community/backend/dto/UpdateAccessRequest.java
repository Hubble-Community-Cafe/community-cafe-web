package cafe.community.backend.dto;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AdminModule;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

/**
 * Request body to set a user's access: the admin switch plus a level per module. Modules left out
 * are hidden. The levels are ignored for an admin, who holds every module.
 */
public record UpdateAccessRequest(boolean admin, @NotNull Map<AdminModule, AccessLevel> permissions) {
}
