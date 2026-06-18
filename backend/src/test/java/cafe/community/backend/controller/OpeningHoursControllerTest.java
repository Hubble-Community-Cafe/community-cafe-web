package cafe.community.backend.controller;

import cafe.community.backend.dto.HoursOverrideRequest;
import cafe.community.backend.dto.WeeklyHoursRequest;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.HoursOverrideRepository;
import cafe.community.backend.repository.OpeningHoursRepository;
import cafe.community.backend.service.OpeningHoursService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OpeningHoursControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired OpeningHoursService service;
    @Autowired OpeningHoursRepository hoursRepo;
    @Autowired HoursOverrideRepository overrideRepo;

    @BeforeEach
    void clean() {
        overrideRepo.deleteAll();
        hoursRepo.deleteAll();
    }

    @Test
    void publicWeeklyHours_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/opening-hours/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));
    }

    @Test
    void publicWeeklyHours_returnsSchedule() throws Exception {
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.MONDAY,
                new WeeklyHoursRequest("11:00", "02:00", "12:00", "19:30"));

        mockMvc.perform(get("/api/opening-hours/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayOfWeek").value("MONDAY"))
                .andExpect(jsonPath("$[0].open").value("11:00"))
                .andExpect(jsonPath("$[0].close").value("02:00"))
                .andExpect(jsonPath("$[0].kitchenOpen").value("12:00"))
                .andExpect(jsonPath("$[0].kitchenClose").value("19:30"));
    }

    @Test
    void publicStatus_noAuthRequired() throws Exception {
        mockMvc.perform(get("/api/opening-hours/HUBBLE/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bar").value("HUBBLE"))
                .andExpect(jsonPath("$.isOpen").isBoolean());
    }

    @Test
    void adminUpsertDay_requiresAuth() throws Exception {
        mockMvc.perform(put("/api/admin/opening-hours/HUBBLE/MONDAY")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"open":"11:00","close":"02:00","kitchenOpen":null,"kitchenClose":null}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminUpsertDay_createsRow() throws Exception {
        mockMvc.perform(put("/api/admin/opening-hours/HUBBLE/MONDAY")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"open":"11:00","close":"02:00","kitchenOpen":null,"kitchenClose":null}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dayOfWeek").value("MONDAY"))
                .andExpect(jsonPath("$.open").value("11:00"));
    }

    @Test
    void adminCloseDay_removesRow() throws Exception {
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.SUNDAY,
                new WeeklyHoursRequest("12:00", "20:00", null, null));

        mockMvc.perform(delete("/api/admin/opening-hours/HUBBLE/SUNDAY")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/opening-hours/HUBBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void publicOverrides_noAuthRequired() throws Exception {
        LocalDate future = LocalDate.now().plusDays(3);
        service.createOverride(BarLocation.HUBBLE,
                new HoursOverrideRequest(future, true, null, null, "Test closure"));

        mockMvc.perform(get("/api/opening-hours/HUBBLE/overrides"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value(future.toString()))
                .andExpect(jsonPath("$[0].closed").value(true))
                .andExpect(jsonPath("$[0].note").value("Test closure"));
    }

    @Test
    void adminCreateOverride_andList() throws Exception {
        LocalDate future = LocalDate.now().plusDays(5);

        mockMvc.perform(post("/api/admin/opening-hours/HUBBLE/overrides")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date":"%s","closed":true,"open":null,"close":null,"note":"Bank holiday"}
                                """.formatted(future)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.closed").value(true))
                .andExpect(jsonPath("$.note").value("Bank holiday"));

        mockMvc.perform(get("/api/admin/opening-hours/HUBBLE/overrides")
                        .with(jwt().jwt(j -> j.claim("oid", "editor-oid")
                                .claim("preferred_username", "editor@test.invalid"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value(future.toString()));
    }
}
