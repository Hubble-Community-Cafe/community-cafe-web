package cafe.community.backend.filter;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.service.AdminUserService;
import cafe.community.backend.util.AuditActorResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

/**
 * Enriches the SecurityContext with role-based authorities for admin endpoints.
 * Runs after JWT authentication: looks up the user in the database (auto-creating
 * on first login), then adds hierarchical {@code ROLE_} authorities.
 */
@Component
public class RoleAuthorizationFilter extends OncePerRequestFilter {

    private final AdminUserService adminUserService;

    public RoleAuthorizationFilter(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
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

            if (oid != null) {
                AdminUser user = adminUserService.getOrCreateUser(oid, email, name);
                List<GrantedAuthority> authorities = buildAuthorities(user.getRole());

                AbstractAuthenticationToken enriched =
                        new JwtAuthenticationToken(jwt, authorities, jwtAuth.getName());
                enriched.setDetails(jwtAuth.getDetails());
                SecurityContextHolder.getContext().setAuthentication(enriched);
            }
        }

        filterChain.doFilter(request, response);
    }

    /** Hierarchical authorities: ADMIN gets all three, EDITOR gets EDITOR + VIEWER, etc. */
    List<GrantedAuthority> buildAuthorities(AdminRole role) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_VIEWER"));
        if (role == AdminRole.EDITOR || role == AdminRole.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_EDITOR"));
        }
        if (role == AdminRole.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return authorities;
    }
}
