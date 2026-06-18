package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.HoursOverride;
import cafe.community.backend.model.OpeningHours;
import cafe.community.backend.repository.HoursOverrideRepository;
import cafe.community.backend.repository.OpeningHoursRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OpeningHoursService {

    private static final ZoneId TZ = ZoneId.of("Europe/Amsterdam");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final OpeningHoursRepository hoursRepo;
    private final HoursOverrideRepository overrideRepo;

    public OpeningHoursService(OpeningHoursRepository hoursRepo, HoursOverrideRepository overrideRepo) {
        this.hoursRepo = hoursRepo;
        this.overrideRepo = overrideRepo;
    }

    /** Weekly schedule for a bar, ordered Monday to Sunday. */
    @Transactional(readOnly = true)
    public List<WeeklyHoursDto> getWeeklyHours(BarLocation bar) {
        return hoursRepo.findAllByBarOrderByDayOfWeek(bar)
                .stream().map(WeeklyHoursDto::from).toList();
    }

    /** Today's open/closed status, factoring in any override for today's date. */
    @Transactional(readOnly = true)
    public BarStatusDto getStatus(BarLocation bar) {
        LocalDate today = LocalDate.now(TZ);
        DayOfWeek dow = today.getDayOfWeek();

        Optional<HoursOverride> override = overrideRepo.findByBarAndDate(bar, today);
        if (override.isPresent()) {
            HoursOverride o = override.get();
            return new BarStatusDto(bar.name(), !o.isClosed(), o.getNote());
        }

        boolean openToday = hoursRepo.existsByBarAndDayOfWeek(bar, dow);
        return new BarStatusDto(bar.name(), openToday, null);
    }

    /** Upsert the standing hours for a specific day. */
    public WeeklyHoursDto upsertDay(BarLocation bar, DayOfWeek day, WeeklyHoursRequest req) {
        OpeningHours hours = hoursRepo.findByBarAndDayOfWeek(bar, day)
                .orElseGet(() -> {
                    OpeningHours h = new OpeningHours();
                    h.setBar(bar);
                    h.setDayOfWeek(day);
                    return h;
                });
        hours.setOpen(LocalTime.parse(req.open(), TIME_FMT));
        hours.setClose(LocalTime.parse(req.close(), TIME_FMT));
        hours.setKitchenOpen(req.kitchenOpen() != null ? LocalTime.parse(req.kitchenOpen(), TIME_FMT) : null);
        hours.setKitchenClose(req.kitchenClose() != null ? LocalTime.parse(req.kitchenClose(), TIME_FMT) : null);
        return WeeklyHoursDto.from(hoursRepo.save(hours));
    }

    /** Mark a day as closed by removing its standing-hours row. */
    public void closeDay(BarLocation bar, DayOfWeek day) {
        hoursRepo.findByBarAndDayOfWeek(bar, day).ifPresent(hoursRepo::delete);
    }

    /** Upcoming (today and future) overrides for a bar. */
    @Transactional(readOnly = true)
    public List<HoursOverrideDto> getUpcomingOverrides(BarLocation bar) {
        LocalDate today = LocalDate.now(TZ);
        return overrideRepo.findAllByBarAndDateGreaterThanEqualOrderByDate(bar, today)
                .stream().map(HoursOverrideDto::from).toList();
    }

    /** Create a one-off date override. */
    public HoursOverrideDto createOverride(BarLocation bar, HoursOverrideRequest req) {
        HoursOverride o = new HoursOverride();
        o.setBar(bar);
        o.setDate(req.date());
        o.setClosed(req.closed());
        o.setOpen(req.open() != null ? LocalTime.parse(req.open(), TIME_FMT) : null);
        o.setClose(req.close() != null ? LocalTime.parse(req.close(), TIME_FMT) : null);
        o.setNote(req.note());
        return HoursOverrideDto.from(overrideRepo.save(o));
    }

    /** Delete a date override by id. */
    public void deleteOverride(Long id) {
        if (!overrideRepo.existsById(id)) throw new EntityNotFoundException("Override not found: " + id);
        overrideRepo.deleteById(id);
    }
}
