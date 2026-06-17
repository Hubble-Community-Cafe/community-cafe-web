package cafe.community.backend.config;

import cafe.community.backend.filter.RoleAuthorizationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Security used <strong>only under the {@code e2e} Spring profile</strong>.
 *
 * <p>Production security ({@link SecurityConfig}, gated to {@code !e2e}) validates
 * real Entra JWTs, which cannot be minted in a headless test environment. This
 * config instead derives the principal from request headers and lets the real
 * {@link RoleAuthorizationFilter} resolve the role from the database, so
 * authorization, RBAC, and audit-actor attribution behave as in production.</p>
 *
 * <p>An e2e request sends {@code X-Test-Oid} (a seeded admin's Azure OID), plus
 * optional {@code X-Test-Email} and {@code X-Test-Name}. Never active outside e2e.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("e2e")
public class E2eSecurityConfig {

    private final RoleAuthorizationFilter roleAuthorizationFilter;

    public E2eSecurityConfig(RoleAuthorizationFilter roleAuthorizationFilter) {
        this.roleAuthorizationFilter = roleAuthorizationFilter;
    }

    @Bean
    public SecurityFilterChain e2eSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(e2eCorsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/", "/actuator/health").permitAll()
                .requestMatchers("/test/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                .anyRequest().authenticated()
            );

        TestHeaderAuthFilter testAuthFilter = new TestHeaderAuthFilter();
        http.addFilterBefore(testAuthFilter, AuthorizationFilter.class);
        http.addFilterAfter(roleAuthorizationFilter, TestHeaderAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource e2eCorsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Authenticates a request from the {@code X-Test-Oid} header by constructing a
     * {@link JwtAuthenticationToken} whose claims mirror an Entra token; the role
     * filter then assigns authorities from the database.
     */
    static class TestHeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String oid = request.getHeader("X-Test-Oid");
            boolean alreadyJwt = SecurityContextHolder.getContext().getAuthentication()
                    instanceof JwtAuthenticationToken;
            if (oid != null && !oid.isBlank() && !alreadyJwt) {
                String email = request.getHeader("X-Test-Email");
                if (email == null || email.isBlank()) email = oid + "@e2e.test";
                String name = request.getHeader("X-Test-Name");
                if (name == null || name.isBlank()) name = oid;

                Instant now = Instant.now();
                Jwt jwt = Jwt.withTokenValue("e2e-test-token")
                        .header("alg", "none")
                        .subject(oid)
                        .claim("oid", oid)
                        .claim("preferred_username", email)
                        .claim("name", name)
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(3600))
                        .build();

                SecurityContextHolder.getContext().setAuthentication(
                        new JwtAuthenticationToken(jwt, List.of()));
            }
            chain.doFilter(request, response);
        }
    }
}
