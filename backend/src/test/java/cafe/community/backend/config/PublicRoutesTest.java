package cafe.community.backend.config;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/**
 * The production chain lets visitors read content and send forms without a token, and nothing
 * else. Anonymous requests only: what a visitor's browser sends.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicRoutesTest {

    @Autowired MockMvc mockMvc;

    @ParameterizedTest(name = "{0} {1} is open")
    @CsvSource({
            "GET, /actuator/health",
            "GET, /api/menu/HUBBLE",
            "GET, /api/daily-dish/today",
            "GET, /api/opening-hours/HUBBLE",
            "GET, /api/events/METEOR",
            "GET, /api/board",
            "GET, /api/vacancies",
            "GET, /api/associations",
            "GET, /api/forms/challenge",
            "POST, /api/forms/tips",
            "GET, /media/nothing-here.jpg",
            "OPTIONS, /api/admin/menu/categories",
    })
    void visitorsReachThePublicRoutesWithoutSigningIn(String method, String path) throws Exception {
        int status = mockMvc.perform(request(HttpMethod.valueOf(method), path)).andReturn().getResponse().getStatus();

        // Not found or a validation error is fine here: the point is that security let it through.
        assertThat(status).as(method + " " + path).isNotIn(401, 403);
    }

    @ParameterizedTest(name = "{0} {1} needs a token")
    @CsvSource({
            "GET, /api/admin/menu/categories",
            "GET, /api/admin/users/me",
            "POST, /api/menu/HUBBLE",
            "DELETE, /api/events/1",
            "GET, /api/anything-else",
    })
    void everythingElseNeedsAToken(String method, String path) throws Exception {
        int status = mockMvc.perform(request(HttpMethod.valueOf(method), path)).andReturn().getResponse().getStatus();

        assertThat(status).as(method + " " + path).isEqualTo(401);
    }
}
