package cafe.community.backend.controller;

import cafe.community.backend.media.TestImages;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static cafe.community.backend.TestUsers.token;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Input the public sites render, and error and health output a client gets to see. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.initial-admin-oid=hardening-admin-oid")
class RequestHardeningTest {

    @Autowired MockMvc mockMvc;

    private static String event(String bar, String subscribeLink) {
        return """
                {"bar":"%s","title":"Pub quiz","date":"2026-12-01","published":true,"subscribeLink":%s}
                """.formatted(bar, subscribeLink == null ? "null" : "\"" + subscribeLink + "\"");
    }

    // ── Links end up as href on the public sites: web links only ──────────────────

    @ParameterizedTest
    @ValueSource(strings = {"javascript:alert(1)", "data:text/html,hi", "www.example.com", "https://a b.example"})
    void anEventSignUpLinkMustBeAWebLink(String link) throws Exception {
        mockMvc.perform(post("/api/admin/events").with(token("hardening-admin-oid"))
                        .contentType("application/json").content(event("HUBBLE", link)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("subscribeLink must start with https:// or http://"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://forms.office.com/r/abc", "HTTP://example.com/x?y=1", ""})
    void anEventAcceptsAWebLinkOrNone(String link) throws Exception {
        mockMvc.perform(post("/api/admin/events").with(token("hardening-admin-oid"))
                        .contentType("application/json").content(event("HUBBLE", link)))
                .andExpect(status().is2xxSuccessful());
        mockMvc.perform(post("/api/admin/events").with(token("hardening-admin-oid"))
                        .contentType("application/json").content(event("METEOR", null)))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void aVacancyApplyLinkMustBeAWebLink() throws Exception {
        mockMvc.perform(post("/api/admin/vacancies").with(token("hardening-admin-oid")).contentType("application/json")
                        .content("{\"title\":\"Bartender\",\"applyLink\":\"javascript:alert(1)\",\"active\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("applyLink must start with https:// or http://"));
    }

    @Test
    void aVacancyApplyEmailMustBeAPlainAddress() throws Exception {
        mockMvc.perform(post("/api/admin/vacancies").with(token("hardening-admin-oid")).contentType("application/json")
                        .content("{\"title\":\"Bartender\",\"applyEmail\":\"jobs@hubble.cafe?bcc=x@evil.example\","
                                + "\"active\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("applyEmail must be an e-mail address"));

        mockMvc.perform(post("/api/admin/vacancies").with(token("hardening-admin-oid")).contentType("application/json")
                        .content("{\"title\":\"Bartender\",\"applyEmail\":\"jobs@hubble.cafe\","
                                + "\"applyLink\":\"https://hubble.cafe/jobs\",\"active\":true}"))
                .andExpect(status().is2xxSuccessful());
    }

    // ── Error messages name the problem, not our Java classes ─────────────────────

    @Test
    void anUnknownBarOnAnEventSaysSoWithoutJavaClassNames() throws Exception {
        mockMvc.perform(post("/api/admin/events").with(token("hardening-admin-oid"))
                        .contentType("application/json").content(event("ATLANTIS", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unknown bar: ATLANTIS. Use HUBBLE or METEOR."));
    }

    @Test
    void anUnknownBarOnAnUploadSaysSoWithoutJavaClassNames() throws Exception {
        mockMvc.perform(multipart("/api/admin/media").with(token("hardening-admin-oid"))
                        .file(new MockMultipartFile("file", "logo.png", "image/png", TestImages.png(2, 2)))
                        .param("bar", "ATLANTIS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(not(containsString("cafe.community"))))
                .andExpect(jsonPath("$.message").value("Unknown bar: ATLANTIS. Use HUBBLE or METEOR."));
    }

    // ── Health: status only, even with a valid token ─────────────────────────────

    @Test
    void theHealthCheckShowsNoDetailsEvenToASignedInUser() throws Exception {
        mockMvc.perform(get("/actuator/health").with(token("hardening-admin-oid")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(content().string(not(containsString("components"))))
                .andExpect(content().string(not(containsString("diskSpace"))));
    }
}
