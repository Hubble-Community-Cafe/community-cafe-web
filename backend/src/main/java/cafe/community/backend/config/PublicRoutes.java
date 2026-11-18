package cafe.community.backend.config;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;

/**
 * What anyone may call without signing in, shared by the production chain ({@link SecurityConfig})
 * and the e2e chain ({@link E2eSecurityConfig}) so the two cannot drift apart: a public endpoint
 * added to one list only would pass the e2e suite and then answer 401 in production.
 */
final class PublicRoutes {

    private PublicRoutes() {
    }

    static void permit(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/", "/actuator/health", "/error").permitAll()
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
            // Public sites read published CMS content without logging in.
            .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/daily-dish/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/opening-hours/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/board/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/vacancies/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/associations/**").permitAll()
            // Public form submissions (honeypot + ALTCHA + rate-limit protected) + the challenge.
            .requestMatchers(HttpMethod.GET, "/api/forms/challenge").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/forms/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/media/**").permitAll();
    }
}
