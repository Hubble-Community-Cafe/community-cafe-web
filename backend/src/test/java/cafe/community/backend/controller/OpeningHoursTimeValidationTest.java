package cafe.community.backend.controller;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static cafe.community.backend.TestUsers.token;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Two digits, a colon and two digits is not yet a time: 99:99 or 24:00 used to pass the check and
 * then fail to parse in the service, a 500. Every time field must be a real 24-hour HH:mm time.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "app.initial-admin-oid=hours-time-admin-oid")
class OpeningHoursTimeValidationTest {

    @Autowired MockMvc mockMvc;

    @ParameterizedTest
    @CsvSource({
            "open, 99:99, Opens", "open, 24:00, Opens", "close, 23:60, Closes", "close, 2300, Closes",
            "kitchenOpen, 25:30, Kitchen opens", "kitchenClose, 7:00, Kitchen closes",
    })
    void weeklyHours_rejectAnyFieldThatIsNotARealTime(String field, String bad, String label) throws Exception {
        String body = """
                {"open":"10:00","close":"23:00","kitchenOpen":"17:00","kitchenClose":"21:00"}
                """.replace("\"" + field + "\":\"" + original(field) + "\"", "\"" + field + "\":\"" + bad + "\"");

        mockMvc.perform(put("/api/admin/opening-hours/HUBBLE/MONDAY").with(token("hours-time-admin-oid"))
                        .contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(label + " must be a time like 20:30"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"00:00", "23:59"})
    void weeklyHours_acceptTheWholeDay(String time) throws Exception {
        mockMvc.perform(put("/api/admin/opening-hours/HUBBLE/TUESDAY").with(token("hours-time-admin-oid"))
                        .contentType("application/json")
                        .content("{\"open\":\"" + time + "\",\"close\":\"" + time + "\"}"))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @CsvSource({"Opens, 10:61, 18:00", "Closes, 10:00, 24:00", "Opens, 99:99, 18:00"})
    void overrides_rejectATimeThatIsNotARealTime(String label, String open, String close) throws Exception {
        mockMvc.perform(post("/api/admin/opening-hours/HUBBLE/overrides").with(token("hours-time-admin-oid"))
                        .contentType("application/json")
                        .content("""
                                {"date":"2026-12-24","closed":false,"open":"%s","close":"%s"}
                                """.formatted(open, close)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(label + " must be a time like 20:30"));
    }

    @ParameterizedTest
    @CsvSource({"10:00, 18:00", "18:00, 02:00"})
    void overrides_acceptRealTimes(String open, String close) throws Exception {
        mockMvc.perform(post("/api/admin/opening-hours/HUBBLE/overrides").with(token("hours-time-admin-oid"))
                        .contentType("application/json")
                        .content("""
                                {"date":"2026-12-24","closed":false,"open":"%s","close":"%s"}
                                """.formatted(open, close)))
                .andExpect(status().is2xxSuccessful());
    }

    private static String original(String field) {
        return switch (field) {
            case "open" -> "10:00";
            case "close" -> "23:00";
            case "kitchenOpen" -> "17:00";
            default -> "21:00";
        };
    }
}
