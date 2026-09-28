package cafe.community.backend.service;

import cafe.community.backend.dto.*;
import cafe.community.backend.model.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class OpeningHoursService {

    private static final ZoneId TZ = ZoneId.of("Europe/Amsterdam");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);

    private final OpeningHoursRepository hoursRepo;
    private final HoursOverrideRepository overrideRepo;
    private final AuditService auditService;

    public OpeningHoursService(OpeningHoursRepository hoursRepo, HoursOverrideRepository overrideRepo,
                               AuditService auditService) {
        this.hoursRepo = hoursRepo;
        this.overrideRepo = overrideRepo;
        this.auditService = auditService;
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
        boolean isNew = hoursRepo.findByBarAndDayOfWeek(bar, day).isEmpty();
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
        OpeningHours saved = hoursRepo.save(hours);
        String label = bar.name() + " " + day.name();
        String summary = (isNew ? "Set hours for " : "Updated hours for ") + label
                + ": " + req.open() + " - " + req.close();
        if (isNew) {
            auditService.recordCreate(AuditEntityType.OPENING_HOURS, saved.getId(), label, List.of(), summary);
        } else {
            auditService.recordAction(AuditEntityType.OPENING_HOURS, saved.getId(), label,
                    AuditAction.UPDATE, List.of(), summary);
        }
        return WeeklyHoursDto.from(saved);
    }

    /** Mark a day as closed by removing its standing-hours row. */
    public void closeDay(BarLocation bar, DayOfWeek day) {
        hoursRepo.findByBarAndDayOfWeek(bar, day).ifPresent(h -> {
            hoursRepo.delete(h);
            auditService.recordDelete(AuditEntityType.OPENING_HOURS, h.getId(),
                    bar.name() + " " + day.name(), "Marked closed: " + bar.name() + " " + day.name());
        });
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
        applyAndValidate(o, req);
        HoursOverride saved = overrideRepo.save(o);
        String label = bar.name() + " " + saved.getDate();
        auditService.recordCreate(AuditEntityType.HOURS_OVERRIDE, saved.getId(), label, List.of(),
                "Added override for " + label + ": " + describe(saved));
        return HoursOverrideDto.from(saved);
    }

    /** Change an existing override: its date, status, times and note. The bar stays the same. */
    public HoursOverrideDto updateOverride(Long id, HoursOverrideRequest req) {
        HoursOverride o = overrideRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Override not found: " + id));
        String oldDate = o.getDate().toString();
        String oldStatus = describe(o);
        String oldNote = o.getNote();

        applyAndValidate(o, req);
        HoursOverride saved = overrideRepo.save(o);

        List<FieldChange> changes = new ArrayList<>();
        if (!oldDate.equals(saved.getDate().toString())) changes.add(new FieldChange("date", oldDate, saved.getDate().toString()));
        if (!oldStatus.equals(describe(saved))) changes.add(new FieldChange("status", oldStatus, describe(saved)));
        if (!Objects.equals(oldNote, saved.getNote())) changes.add(new FieldChange("note", oldNote, saved.getNote()));
        String label = saved.getBar().name() + " " + saved.getDate();
        auditService.recordUpdate(AuditEntityType.HOURS_OVERRIDE, saved.getId(), label, changes,
                "Updated override for " + label + ": " + describe(saved));
        return HoursOverrideDto.from(saved);
    }

    /**
     * Copy a request onto an override, enforcing the rules staff see as messages: one override per
     * bar and date (two would make today's status ambiguous), a closed day has no times, and an open
     * day has both an opening and a closing time or neither (neither shows plain "Open"). A closing
     * time before the opening time means past midnight, e.g. 20:00 to 02:00.
     */
    private void applyAndValidate(HoursOverride o, HoursOverrideRequest req) {
        overrideRepo.findByBarAndDate(o.getBar(), req.date())
                .filter(existing -> !existing.getId().equals(o.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("There is already an override for "
                            + req.date().format(DAY_FMT) + ". Edit that one instead.");
                });

        LocalTime open = null;
        LocalTime close = null;
        if (!req.closed()) {
            boolean hasOpen = req.open() != null && !req.open().isBlank();
            boolean hasClose = req.close() != null && !req.close().isBlank();
            if (hasOpen != hasClose) {
                throw new IllegalArgumentException(
                        "Enter both an opening and a closing time, or leave both empty to show \"Open\".");
            }
            if (hasOpen) {
                open = LocalTime.parse(req.open(), TIME_FMT);
                close = LocalTime.parse(req.close(), TIME_FMT);
                if (open.equals(close)) {
                    throw new IllegalArgumentException("The opening and closing time cannot be the same.");
                }
            }
        }
        o.setDate(req.date());
        o.setClosed(req.closed());
        o.setOpen(open);
        o.setClose(close);
        o.setNote(req.note() == null || req.note().isBlank() ? null : req.note().trim());
    }

    /** "Closed", "Open" or "Open 20:00 to 02:00", plus the note, for the audit log. */
    private static String describe(HoursOverride o) {
        String status = o.isClosed() ? "Closed"
                : o.getOpen() != null ? "Open " + o.getOpen().format(TIME_FMT) + " to " + o.getClose().format(TIME_FMT)
                : "Open";
        return status + (o.getNote() != null ? " (" + o.getNote() + ")" : "");
    }

    /** Delete a date override by id. */
    public void deleteOverride(Long id) {
        HoursOverride override = overrideRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Override not found: " + id));
        String label = override.getBar().name() + " " + override.getDate();
        overrideRepo.deleteById(id);
        auditService.recordDelete(AuditEntityType.HOURS_OVERRIDE, id, label,
                "Deleted override for " + label);
    }
}
