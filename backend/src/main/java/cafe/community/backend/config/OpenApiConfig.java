package cafe.community.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Community Cafe Web API",
        version = "0.0.1",
        description = """
            Shared staff/board CMS for the Hubble and Meteor community cafes.

            ## Endpoints
            - `GET /api/menu/**`, `/api/daily-dish/**`, `/api/opening-hours/**`, `/api/events/**`,
              `/api/board/**`, `/api/vacancies/**`, `/api/associations/**`: published CMS content
              for the public sites (no login)
            - `POST /api/forms/**`: public forms (honeypot, ALTCHA and rate limit)
            - `GET/POST/PUT/DELETE /api/admin/**`: staff/board management (Entra login + role)
            - `GET /actuator/health`: health check
            """,
        contact = @Contact(name = "Hubble & Meteor Community Cafes", url = "https://hubble.cafe")
    ),
    servers = { @Server(url = "http://localhost:8080", description = "Local development") }
)
public class OpenApiConfig {
}
