package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.HoursOverrideRepository;
import cafe.community.backend.repository.OpeningHoursRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OpeningHoursServiceTest {

    @Autowired OpeningHoursService service;
    @Autowired OpeningHoursRepository hoursRepo;
    @Autowired HoursOverrideRepository overrideRepo;

    @BeforeEach
    void clean() {
        overrideRepo.deleteAll();
        hoursRepo.deleteAll();
    }

    @Test
    void upsertAndFetchWeeklyHours() {
        WeeklyHoursRequest req = new WeeklyHoursRequest("11:00", "02:00", "12:00", "19:30");
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.MONDAY, req);
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.TUESDAY, req);

        var hours = service.getWeeklyHours(BarLocation.HUBBLE);
        assertThat(hours).hasSize(2);
        assertThat(hours.get(0).dayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(hours.get(0).open()).isEqualTo("11:00");
        assertThat(hours.get(0).close()).isEqualTo("02:00");
        assertThat(hours.get(0).kitchenOpen()).isEqualTo("12:00");
        assertThat(hours.get(0).kitchenClose()).isEqualTo("19:30");
    }

    @Test
    void upsertIsIdempotent() {
        WeeklyHoursRequest first = new WeeklyHoursRequest("11:00", "02:00", null, null);
        WeeklyHoursRequest updated = new WeeklyHoursRequest("12:00", "01:00", null, null);

        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.FRIDAY, first);
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.FRIDAY, updated);

        var hours = service.getWeeklyHours(BarLocation.HUBBLE);
        assertThat(hours).hasSize(1);
        assertThat(hours.get(0).open()).isEqualTo("12:00");
        assertThat(hours.get(0).close()).isEqualTo("01:00");
    }

    @Test
    void closeDayRemovesRow() {
        service.upsertDay(BarLocation.HUBBLE, DayOfWeek.SUNDAY, new WeeklyHoursRequest("12:00", "20:00", null, null));
        assertThat(service.getWeeklyHours(BarLocation.HUBBLE)).hasSize(1);

        service.closeDay(BarLocation.HUBBLE, DayOfWeek.SUNDAY);
        assertThat(service.getWeeklyHours(BarLocation.HUBBLE)).isEmpty();
    }

    @Test
    void statusOpenWhenHoursExistForToday() {
        DayOfWeek today = LocalDate.now().getDayOfWeek();
        service.upsertDay(BarLocation.METEOR, today, new WeeklyHoursRequest("09:00", "23:00", null, null));

        BarStatusDto status = service.getStatus(BarLocation.METEOR);
        assertThat(status.isOpen()).isTrue();
        assertThat(status.bannerMessage()).isNull();
    }

    @Test
    void statusClosedWhenNoHoursForToday() {
        BarStatusDto status = service.getStatus(BarLocation.HUBBLE);
        assertThat(status.isOpen()).isFalse();
        assertThat(status.bannerMessage()).isNull();
    }

    @Test
    void overrideClosedTakesPrecedenceOverSchedule() {
        DayOfWeek today = LocalDate.now().getDayOfWeek();
        service.upsertDay(BarLocation.HUBBLE, today, new WeeklyHoursRequest("11:00", "02:00", null, null));

        service.createOverride(BarLocation.HUBBLE, new HoursOverrideRequest(
                LocalDate.now(), true, null, null, "Public holiday"));

        BarStatusDto status = service.getStatus(BarLocation.HUBBLE);
        assertThat(status.isOpen()).isFalse();
        assertThat(status.bannerMessage()).isEqualTo("Public holiday");
    }

    @Test
    void createAndDeleteOverride() {
        HoursOverrideDto dto = service.createOverride(BarLocation.METEOR,
                new HoursOverrideRequest(LocalDate.now().plusDays(3), true, null, null, "Closed for event"));

        assertThat(service.getUpcomingOverrides(BarLocation.METEOR)).hasSize(1);

        service.deleteOverride(dto.id());
        assertThat(service.getUpcomingOverrides(BarLocation.METEOR)).isEmpty();
    }
}
