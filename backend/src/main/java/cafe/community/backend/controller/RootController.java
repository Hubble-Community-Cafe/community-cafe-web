package cafe.community.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** A small unauthenticated landing endpoint so the root URL is not a 401/404. */
@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
                "service", "community-cafe-backend",
                "status", "ok",
                "docs", "/swagger-ui.html");
    }
}
