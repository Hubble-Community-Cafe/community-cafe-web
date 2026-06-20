package cafe.community.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the e2e support wiring under the real {@code e2e} profile (E2eSecurityConfig +
 * TestSupportController), but on H2 instead of MariaDB. This catches breakage of the test
 * harness's reset/seed contract without needing the docker stack.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:e2esupport;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "azure.tenant-id=",
        "azure.client-id=",
})
class E2eTestSupportTest {

    @Autowired MockMvc mockMvc;

    @Test
    void reset_isPermittedWithoutAuth() throws Exception {
        mockMvc.perform(post("/test/reset"))
                .andExpect(status().isNoContent());
    }

    @Test
    void reset_clearsSelfReferentialMenuCategories() throws Exception {
        mockMvc.perform(post("/test/users").contentType("application/json")
                .content("{\"oid\":\"seeder\",\"role\":\"ADMIN\"}")).andExpect(status().isNoContent());

        // A tab plus a sub-category populates menu_category's self-referential parent_id.
        String tab = mockMvc.perform(post("/api/admin/menu/categories").header("X-Test-Oid", "seeder")
                        .contentType("application/json")
                        .content("{\"name\":\"Drinks\",\"kind\":\"DRINK\",\"sortOrder\":0}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long tabId = Long.parseLong(tab.replaceAll(".*\"id\"\\s*:\\s*(\\d+).*", "$1"));
        mockMvc.perform(post("/api/admin/menu/categories").header("X-Test-Oid", "seeder")
                        .contentType("application/json")
                        .content("{\"name\":\"Beer\",\"kind\":\"DRINK\",\"sortOrder\":0,\"parentId\":" + tabId + "}"))
                .andExpect(status().isCreated());

        // Reset must clear it without tripping the parent_id FK (regression: it did on MariaDB).
        mockMvc.perform(post("/test/reset")).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/menu/HUBBLE")).andExpect(status().isOk());
    }

    @Test
    void cors_allowsBoth127AndLocalhostOrigins() throws Exception {
        // The e2e public sites load from 127.0.0.1:<port> and call the API cross-origin;
        // the browser fetch fails unless that exact origin is allowed.
        mockMvc.perform(get("/api/associations/HUBBLE").header("Origin", "http://127.0.0.1:6173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:6173"));
        mockMvc.perform(get("/api/associations/HUBBLE").header("Origin", "http://localhost:6173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:6173"));
    }

    @Test
    void seedUser_isPermittedWithoutAuth() throws Exception {
        mockMvc.perform(post("/test/users")
                        .contentType("application/json")
                        .content("{\"oid\":\"e2e-seeder\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void publicReadIsOpen_butAdminWriteNeedsAuth() throws Exception {
        mockMvc.perform(get("/api/associations/HUBBLE")).andExpect(status().isOk());
        // No X-Test-Oid header -> anonymous. The e2e chain has no OAuth2 entry point, so a
        // denied request is 403 (the real Entra chain would answer 401); the point is it is
        // rejected, not silently allowed.
        mockMvc.perform(post("/api/admin/associations")
                        .contentType("application/json").content("{\"name\":\"X\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void headerBridgeAuthorizesSeededUser() throws Exception {
        mockMvc.perform(post("/test/users")
                        .contentType("application/json")
                        .content("{\"oid\":\"e2e-seeder\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/admin/associations")
                        .header("X-Test-Oid", "e2e-seeder")
                        .contentType("application/json")
                        .content("{\"name\":\"Header Bridged\",\"bar\":\"HUBBLE\"}"))
                .andExpect(status().isCreated());
    }
}
