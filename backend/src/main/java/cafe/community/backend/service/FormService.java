package cafe.community.backend.service;

import cafe.community.backend.altcha.AltchaService;
import cafe.community.backend.dto.ComplaintRequest;
import cafe.community.backend.dto.DeclarationRequest;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.mail.FormEmail;
import cafe.community.backend.mail.FormMailService;
import cafe.community.backend.model.FormSubmission;
import cafe.community.backend.model.FormType;
import cafe.community.backend.repository.FormSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;

/**
 * Validates and processes public form submissions: honeypot screening, field/file validation,
 * a stored audit record (no file persisted), and a plain-text staff notification with the
 * uploaded file attached. Recipients are configured per form via {@code app.mail.forms.*}.
 */
@Service
public class FormService {

    private static final Logger log = LoggerFactory.getLogger(FormService.class);
    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> SCREEN_TYPES = Set.of("image/jpeg", "image/png", "video/mp4");
    private static final Set<String> RECEIPT_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");

    private final FormMailService mail;
    private final AltchaService altcha;
    private final FormSubmissionRepository repo;
    private final String complaintsTo;
    private final String screensTo;
    private final String declarationsTo;
    private final String declarationsCc;
    private final String hubbleFrom;
    private final String meteorFrom;

    public FormService(
            FormMailService mail,
            AltchaService altcha,
            FormSubmissionRepository repo,
            @Value("${app.mail.forms.complaints:nuisance@hubble.cafe}") String complaintsTo,
            @Value("${app.mail.forms.screens:screens@hubble.cafe}") String screensTo,
            @Value("${app.mail.forms.declarations:finance@hubble.cafe}") String declarationsTo,
            @Value("${app.mail.forms.declarations-cc:}") String declarationsCc,
            @Value("${app.mail.from.hubble:noreply@hubble.cafe}") String hubbleFrom,
            @Value("${app.mail.from.meteor:noreply@meteor.cafe}") String meteorFrom) {
        this.mail = mail;
        this.altcha = altcha;
        this.repo = repo;
        this.complaintsTo = complaintsTo;
        this.screensTo = screensTo;
        this.declarationsTo = declarationsTo;
        this.declarationsCc = declarationsCc;
        this.hubbleFrom = hubbleFrom;
        this.meteorFrom = meteorFrom;
    }

    // ── Complaint / tip / idea (Meteor) ──────────────────────────────────────────

    public void submitComplaint(ComplaintRequest req) {
        if (isBot(req.honeypot())) return;
        requireCaptcha(req.altcha());

        String label = switch (req.type()) {
            case "TIP" -> "Tip";
            case "IDEA" -> "Idea";
            default -> "Complaint";
        };
        String body = "New " + label.toLowerCase() + " from the Meteor website\n\n"
                + "Name: " + req.name() + "\n"
                + "Email: " + req.email() + "\n"
                + "Phone: " + orDash(req.phone()) + "\n"
                + "Date: " + orDash(req.date()) + "\n"
                + "Type: " + label + "\n\n"
                + "Message:\n" + req.message() + "\n";

        record(FormType.COMPLAINT, req.name(), req.email(), false, body);
        mail.send(new FormEmail(meteorFrom, complaintsTo, null, req.email(),
                "Meteor " + label + " from " + req.name(), body, List.of()));
    }

    // ── Poster screens (Hubble) ──────────────────────────────────────────────────

    public void submitScreen(ScreenRequest req) {
        if (isBot(req.getHoneypot())) return;
        requireCaptcha(req.getAltcha());

        String period;
        if (req.isPermanent()) {
            period = "Type: Permanent association poster (general, no fixed dates)";
        } else {
            if (isBlank(req.getStartDate()) || isBlank(req.getEndDate())) {
                throw new IllegalArgumentException(
                        "Please provide a start and end date, or mark this as a permanent poster.");
            }
            LocalDate start = parseDate(req.getStartDate(), "start date");
            LocalDate end = parseDate(req.getEndDate(), "end date");
            if (end.isBefore(start)) {
                throw new IllegalArgumentException("The end date must be on or after the start date.");
            }
            period = "Start Date: " + req.getStartDate() + "\nEnd Date: " + req.getEndDate();
        }
        FormEmail.Attachment poster = requireFile(req.getFile(), SCREEN_TYPES,
                "a JPG, PNG or MP4 poster");

        String body = "Screen Request from " + req.getName() + " - " + req.getAssociation() + "\n\n"
                + "Personal Details:\n"
                + "Name: " + req.getName() + "\n"
                + "Association: " + req.getAssociation() + "\n"
                + "Mail: " + req.getEmail() + "\n\n"
                + "Cafe: " + cafeLabel(req.getCafe()) + "\n"
                + period + "\n"
                + "Hex: " + orDash(req.getHexColor()) + "\n\n"
                + "Message:\n" + orDash(req.getMessage()) + "\n";

        record(FormType.SCREEN, req.getName(), req.getEmail(), true, body);
        mail.send(new FormEmail(hubbleFrom, screensTo, null, req.getEmail(),
                "Screen Request from " + req.getName() + " - " + req.getAssociation(),
                body, List.of(poster)));
    }

    // ── E-declaration (Hubble) ───────────────────────────────────────────────────

    public void submitDeclaration(DeclarationRequest req) {
        if (isBot(req.getHoneypot())) return;
        requireCaptcha(req.getAltcha());

        BigDecimal amount = parseAmount(req.getAmount());
        FormEmail.Attachment receipt = requireFile(req.getFile(), RECEIPT_TYPES,
                "a PDF or image receipt");

        String body = "New E-Declaration from the website\n\n"
                + "Full name: " + req.getFullName() + "\n"
                + "Email address: " + req.getEmail() + "\n"
                + "Phone Number: " + orDash(req.getPhone()) + "\n"
                + "IBAN: " + normalizeIban(req.getIban()) + "\n"
                + "Date of Purchase: " + req.getDateOfPurchase() + "\n"
                + "Amount in Euros: " + amount.toPlainString() + "\n"
                + "Category: " + req.getCategory() + "\n"
                + "Description: " + orDash(req.getDescription()) + "\n";

        record(FormType.DECLARATION, req.getFullName(), req.getEmail(), true, body);
        mail.send(new FormEmail(hubbleFrom, declarationsTo,
                declarationsCc != null && !declarationsCc.isBlank() ? declarationsCc : null,
                req.getEmail(), "New E-Declaration from " + req.getFullName(),
                body, List.of(receipt)));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /** Reject the submission if the ALTCHA proof-of-work is missing or invalid. */
    private void requireCaptcha(String altchaPayload) {
        if (!altcha.verify(altchaPayload)) {
            throw new IllegalArgumentException("Captcha verification failed. Please try again.");
        }
    }

    /** Honeypot: a hidden field a human never fills. A non-blank value is a bot; drop silently. */
    private boolean isBot(String honeypot) {
        if (honeypot != null && !honeypot.isBlank()) {
            log.info("Dropped a honeypot-triggered form submission.");
            return true;
        }
        return false;
    }

    private void record(FormType type, String name, String email, boolean hadAttachment, String summary) {
        FormSubmission s = new FormSubmission();
        s.setType(type);
        s.setSubmitterName(name);
        s.setSubmitterEmail(email);
        s.setHadAttachment(hadAttachment);
        s.setSummary(summary);
        repo.save(s);
    }

    private FormEmail.Attachment requireFile(MultipartFile file, Set<String> allowedTypes, String what) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please attach " + what + ".");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("The file is too large (max 10 MB).");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type. Please upload " + what + ".");
        }
        try {
            String name = file.getOriginalFilename();
            return new FormEmail.Attachment(name != null && !name.isBlank() ? name : "attachment",
                    contentType, file.getBytes());
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the uploaded file.");
        }
    }

    private LocalDate parseDate(String value, String what) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Please provide a valid " + what + " (YYYY-MM-DD).");
        }
    }

    private BigDecimal parseAmount(String raw) {
        try {
            BigDecimal amount = new BigDecimal(raw.trim().replace(",", "."));
            if (amount.signum() <= 0) {
                throw new IllegalArgumentException("The amount must be greater than zero.");
            }
            return amount;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Please provide a valid amount, e.g. 12,50.");
        }
    }

    private String normalizeIban(String iban) {
        return iban.replace(" ", "").toUpperCase();
    }

    private String cafeLabel(String cafe) {
        return switch (cafe) {
            case "HUBBLE" -> "Hubble";
            case "METEOR" -> "Meteor";
            default -> "Both";
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String orDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
