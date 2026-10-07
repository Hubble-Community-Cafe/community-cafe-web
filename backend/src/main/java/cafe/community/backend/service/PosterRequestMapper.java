package cafe.community.backend.service;

import cafe.community.backend.aurora.Aurora;
import cafe.community.backend.aurora.AuroraRejectedException;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.mail.FormEmail;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Turns a Hubble poster screens form into an Aurora poster request, and an Aurora refusal into a
 * message for the requester. Together with {@link Aurora.PosterRequest#toMultipart()} (the wire
 * field names) this is the whole mapping, so a change on Aurora's side lands here.
 *
 * <p>The reviewer can change every poster field in the Aurora backoffice before approving.
 */
final class PosterRequestMapper {

    /** The screens hang in Eindhoven, so a chosen day runs from midnight to midnight there. */
    static final ZoneId SCREENS_ZONE = ZoneId.of("Europe/Amsterdam");

    /** Seconds a poster stays on screen per turn in the carousel. */
    static final int DEFAULT_TIMEOUT_SECONDS = 30;

    private PosterRequestMapper() {
    }

    /**
     * The request for Aurora. A permanent poster has no dates; a dated one runs from 00:00 on the
     * start day until 00:00 after the end day, so the end day is fully included and a single-day
     * poster still expires after it starts. No label is sent: nothing new shows on the screens
     * until the reviewer sets one. The footer size is left to Aurora's default.
     *
     * @param start the start day, or null for a permanent poster
     * @param end   the end day, or null for a permanent poster
     */
    static Aurora.PosterRequest toPosterRequest(ScreenRequest req, LocalDate start, LocalDate end,
                                                FormEmail.Attachment poster) {
        boolean dated = start != null && end != null;
        return new Aurora.PosterRequest(
                req.getName().trim(),
                req.getEmail().trim(),
                req.getAssociation().trim(),
                blankToNull(req.getMessage()),
                posterName(req.getAssociation(), start, end),
                null,
                dated ? startOfDay(start) : null,
                dated ? startOfDay(end.plusDays(1)) : null,
                blankToNull(req.getHexColor()),
                DEFAULT_TIMEOUT_SECONDS,
                new Aurora.Upload(poster.filename(), poster.contentType(), poster.data()));
    }

    /** Internal poster name in Aurora, for example "Doppio: 2026-07-01 to 2026-07-15". */
    static String posterName(String association, LocalDate start, LocalDate end) {
        String period = start == null || end == null ? "permanent" : start + " to " + end;
        return association.trim() + ": " + period;
    }

    /** What the requester reads when Aurora refuses the request. Sending it again won't help. */
    static String rejectionMessage(AuroraRejectedException.Reason reason) {
        return switch (reason) {
            case TOO_LARGE -> "Your poster is too large for the screens. Use a file of at most 20 MB "
                    + "and an image of at most 3840 × 2160 pixels.";
            case UNSUPPORTED_FILE -> "We could not read your poster. Please upload a valid JPG, PNG or "
                    + "MP4 file (iPhone .mov videos are not supported).";
            case INVALID -> "The screens system could not accept your request. Please check your "
                    + "details and try again.";
        };
    }

    private static OffsetDateTime startOfDay(LocalDate day) {
        return day.atStartOfDay(SCREENS_ZONE).toOffsetDateTime();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
