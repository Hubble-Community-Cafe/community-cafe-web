package cafe.community.backend.filter;

import cafe.community.backend.model.AccessLevel;
import cafe.community.backend.model.AdminModule;
import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.service.AdminUserService;
import cafe.community.backend.util.AuditActorResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Enriches the SecurityContext with database-backed authorities for admin endpoints.
 * Runs after JWT authentication: looks up the user in the database (auto-creating
 * on first login), then adds {@code ROLE_ADMIN} for admins and per-module authorities.
 *
 * <p>When {@code azure.allowed-group-id} is set, the token must also carry that Entra security
 * group in its {@code groups} claim. Tokens without it get a 403 before any user row is created,
 * so tenant members outside the staff group cannot reach the API even if they obtain a token.
 * Requires the app registration to emit the groups claim in access tokens.</p>
 */
@Component
public class RoleAuthorizationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RoleAuthorizationFilter.class);

    private final AdminUserService adminUserService;
    private final String allowedGroupId;

    public RoleAuthorizationFilter(AdminUserService adminUserService,
                                   @Value("${azure.allowed-group-id:}") String allowedGroupId) {
        this.adminUserService = adminUserService;
        this.allowedGroupId = allowedGroupId == null ? "" : allowedGroupId.trim();
        if (this.allowedGroupId.isEmpty()) {
            log.warn("ALLOWED_GROUP_ID is not set: the backend accepts every user of the tenant. "
                    + "Staff group membership is then only checked by the admin UI.");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();

            String oid = AuditActorResolver.extractOid(jwt);
            String email = AuditActorResolver.extractEmail(jwt);
            if (email == null) email = "unknown";
            String name = AuditActorResolver.extractName(jwt);

            if (!isInAllowedGroup(jwt)) {
                rejectNotInGroup(response, oid);
                return;
            }

            if (oid != null) {
                AdminUser user = adminUserService.getOrCreateUser(oid, email, name);
                List<GrantedAuthority> authorities = buildAuthorities(user);

                AbstractAuthenticationToken enriched =
                        new JwtAuthenticationToken(jwt, authorities, jwtAuth.getName());
                enriched.setDetails(jwtAuth.getDetails());
                SecurityContextHolder.getContext().setAuthentication(enriched);
            }
        }

        filterChain.doFilter(request, response);
    }

    /** True when no group restriction is configured or the token lists the allowed group. */
    boolean isInAllowedGroup(Jwt jwt) {
        if (allowedGroupId.isEmpty()) {
            return true;
        }
        List<String> groups = jwt.getClaimAsStringList("groups");
        return groups != null && groups.contains(allowedGroupId);
    }

    private void rejectNotInGroup(HttpServletResponse response, String oid) throws IOException {
        // Entra leaves the groups claim out for users in more than 200 groups (overage) and adds
        // a _claim_names pointer instead. Such a user is refused, which fails safe.
        log.warn("Rejected token for oid={}: not a member of the allowed staff group", oid);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"NOT_IN_STAFF_GROUP\","
                + "\"message\":\"You are not a member of the staff group for this application.\"}");
    }

    /**
     * The user's authorities: {@code ROLE_ADMIN} for an admin, plus one {@code <MODULE>_<LEVEL>}
     * authority per module and level held (EDIT includes VIEW; admins hold every module).
     */
    List<GrantedAuthority> buildAuthorities(AdminUser user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() == AdminRole.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        for (Map.Entry<AdminModule, AccessLevel> permission : user.effectivePermissions().entrySet()) {
            AdminModule module = permission.getKey();
            AccessLevel held = permission.getValue();
            for (AccessLevel level : new AccessLevel[]{AccessLevel.VIEW, AccessLevel.EDIT}) {
                if (held.includes(level)) {
                    authorities.add(new SimpleGrantedAuthority(module.authority(level)));
                }
            }
        }
        return authorities;
    }
}
