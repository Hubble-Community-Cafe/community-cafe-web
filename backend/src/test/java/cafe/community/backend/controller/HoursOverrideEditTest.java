package cafe.community.backend.controller;

import cafe.community.backend.dto.HoursOverrideDto;
import cafe.community.backend.dto.HoursOverrideRequest;
import cafe.community.backend.model.AuditAction;
import cafe.community.backend.model.AuditEntityType;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.AuditLogRepository;
import cafe.community.backend.repository.HoursOverrideRepository;
import cafe.community.backend.service.OpeningHoursService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Editing date overrides, and custom hours on open overrides (issue 131). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.initial-admin-oid = editor-oid")
@Transactional
class HoursOverrideEditTest {

    @Autowired MockMvc mockMvc;
    @Autowired OpeningHoursService service;
    @Autowired HoursOverrideRepository overrideRepo;
    @Autowired AuditLogRepository auditRepo;

    private final LocalDate day = LocalDate.now().plusDays(10);

    @BeforeEach
    void clean() {
        overrideRepo.deleteAll();
    }

    @Test
    void anOpenOverrideWithTimesShowsThemOnThePublicList() throws Exception {
        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, false, "20:00", "02:00", "LED Party")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.open").value("20:00"))
                .andExpect(jsonPath("$.close").value("02:00"));

        mockMvc.perform(get("/api/opening-hours/HUBBLE/overrides"))
                .andExpect(jsonPath("$[0].closed").value(false))
                .andExpect(jsonPath("$[0].open").value("20:00"))
                .andExpect(jsonPath("$[0].close").value("02:00"))
                .andExpect(jsonPath("$[0].note").value("LED Party"));
    }

    @Test
    void anEditorChangesTheDateStatusTimesAndNoteOfAnOverride() throws Exception {
        HoursOverrideDto created = service.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(day, true, null, null, "Bank holidy"));
        LocalDate later = day.plusDays(1);

        send(put("/api/admin/opening-hours/overrides/" + created.id()), later, false, "16:00", "23:00", "Bank holiday")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.id()))
                .andExpect(jsonPath("$.date").value(later.toString()))
                .andExpect(jsonPath("$.closed").value(false))
                .andExpect(jsonPath("$.open").value("16:00"))
                .andExpect(jsonPath("$.close").value("23:00"))
                .andExpect(jsonPath("$.note").value("Bank holiday"));

        assertThat(overrideRepo.findAll()).hasSize(1);
        assertThat(auditRepo.findAll())
                .anyMatch(a -> a.getEntityType() == AuditEntityType.HOURS_OVERRIDE
                        && a.getAction() == AuditAction.UPDATE
                        && a.getChanges().contains("Open 16:00 to 23:00"));
    }

    @Test
    void anOpenOverrideWithoutTimesStaysPlainOpen() throws Exception {
        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, false, null, null, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.open").isEmpty())
                .andExpect(jsonPath("$.close").isEmpty());
    }

    @Test
    void onlyOneTimeIsRefusedWithAClearMessage() throws Exception {
        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, false, "20:00", null, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Enter both an opening and a closing time, or leave both empty to show \"Open\"."));
    }

    @Test
    void theSameOpeningAndClosingTimeIsRefused() throws Exception {
        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, false, "20:00", "20:00", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The opening and closing time cannot be the same."));
    }

    @Test
    void aClosedOverrideDropsAnyTimes() throws Exception {
        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, true, "20:00", "02:00", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.closed").value(true))
                .andExpect(jsonPath("$.open").isEmpty())
                .andExpect(jsonPath("$.close").isEmpty());
    }

    @Test
    void aSecondOverrideForTheSameDateIsRefusedWhenAddingOrEditing() throws Exception {
        service.createOverride(BarLocation.HUBBLE, new HoursOverrideRequest(day, true, null, null, null));
        HoursOverrideDto other = service.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(day.plusDays(3), true, null, null, null));
        String expected = "There is already an override for "
                + day.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH))
                + ". Edit that one instead.";

        send(post("/api/admin/opening-hours/HUBBLE/overrides"), day, false, null, null, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(expected));
        send(put("/api/admin/opening-hours/overrides/" + other.id()), day, true, null, null, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(expected));
    }

    @Test
    void theSameDateOnTheOtherBarIsFine_andAnOverrideKeepsItsOwnDate() throws Exception {
        HoursOverrideDto hubble = service.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(day, true, null, null, null));

        send(post("/api/admin/opening-hours/METEOR/overrides"), day, true, null, null, null)
                .andExpect(status().isCreated());
        send(put("/api/admin/opening-hours/overrides/" + hubble.id()), day, true, null, null, "Christmas")
                .andExpect(status().isOk());
    }

    @Test
    void aViewerCannotEditAnOverride() throws Exception {
        HoursOverrideDto created = service.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(day, true, null, null, null));

        mockMvc.perform(put("/api/admin/opening-hours/overrides/" + created.id())
                        .with(jwt().jwt(j -> j.claim("oid", "viewer-oid").claim("preferred_username", "viewer@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(day, false, null, null, null)))
                .andExpect(status().isForbidden());
    }

    private ResultActions send(MockHttpServletRequestBuilder request,
                               LocalDate date, boolean closed, String open, String close, String note) throws Exception {
        return mockMvc.perform(request.with(editor()).contentType(MediaType.APPLICATION_JSON)
                .content(body(date, closed, open, close, note)));
    }

    private static String body(LocalDate date, boolean closed, String open, String close, String note) {
        return """
                {"date":"%s","closed":%s,"open":%s,"close":%s,"note":%s}
                """.formatted(date, closed, json(open), json(close), json(note));
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private static RequestPostProcessor editor() {
        return jwt().jwt(j -> j.claim("oid", "editor-oid").claim("preferred_username", "editor@test.invalid"));
    }
}
