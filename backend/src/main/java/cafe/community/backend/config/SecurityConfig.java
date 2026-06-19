package cafe.community.backend.config;

import cafe.community.backend.filter.RoleAuthorizationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

/**
 * Production security: validates Microsoft Entra (Azure AD) JWTs and enriches
 * admin requests with database-backed roles. Public read endpoints (the CMS
 * content the public sites fetch) and health/docs are open; {@code /api/admin/**}
 * requires authentication. Gated to {@code !e2e}; the e2e profile uses a header
 * bridge instead (see {@link E2eSecurityConfig}).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("!e2e")
public class SecurityConfig {

    @Value("${azure.tenant-id:}")
    private String azureTenantId;

    @Value("${azure.client-id:}")
    private String azureClientId;

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOrigins;

    private final RoleAuthorizationFilter roleAuthorizationFilter;

    public SecurityConfig(RoleAuthorizationFilter roleAuthorizationFilter) {
        this.roleAuthorizationFilter = roleAuthorizationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // CSRF disabled: stateless JWT bearer auth (not cookies), so CSRF does not apply.
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/", "/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                // Public sites read published CMS content without logging in.
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/daily-dish/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/opening-hours/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/board/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/vacancies/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/media/**").permitAll()
                // Everything under /api/admin requires a valid staff token.
                .requestMatchers("/api/admin/**").authenticated()
                .anyRequest().authenticated()
            );

        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        // Enrich authenticated admin requests with role-based authorities.
        http.addFilterAfter(roleAuthorizationFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        if (azureTenantId == null || azureTenantId.isEmpty()) {
            // No tenant configured (e.g. local dev without Entra): a decoder that
            // refuses real tokens. Tests inject authentication directly instead.
            return token -> {
                throw new IllegalStateException("JWT auth not configured: azure.tenant-id is not set");
            };
        }

        String jwkSetUri = "https://login.microsoftonline.com/" + azureTenantId + "/discovery/v2.0/keys";
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        // Azure AD issues v1.0 or v2.0 issuers depending on accessTokenAcceptedVersion.
        String issuerV1 = "https://sts.windows.net/" + azureTenantId + "/";
        String issuerV2 = "https://login.microsoftonline.com/" + azureTenantId + "/v2.0";
        OAuth2TokenValidator<Jwt> issuerValidator = new JwtClaimValidator<String>(
                JwtClaimNames.ISS, iss -> issuerV1.equals(iss) || issuerV2.equals(iss));

        OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<>(
                JwtClaimNames.AUD, aud -> {
            if (azureClientId == null || azureClientId.isEmpty()) {
                return true;
            }
            String expected = "api://" + azureClientId;
            if (aud instanceof String single) {
                return expected.equals(single) || azureClientId.equals(single);
            }
            if (aud instanceof Collection<?> audiences) {
                return audiences.contains(expected) || audiences.contains(azureClientId);
            }
            return false;
        });

        jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(), issuerValidator, audienceValidator));
        return jwtDecoder;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        if (corsAllowedOrigins != null && !corsAllowedOrigins.isEmpty()) {
            configuration.setAllowedOrigins(Arrays.asList(corsAllowedOrigins.split(",")));
        } else {
            configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin",
                "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
