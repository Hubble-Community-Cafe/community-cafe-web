package cafe.community.backend.service;

import cafe.community.backend.altcha.AltchaService;
import cafe.community.backend.dto.ComplaintRequest;
import cafe.community.backend.dto.DeclarationRequest;
import cafe.community.backend.dto.InformationRequest;
import cafe.community.backend.dto.LoanRequest;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.dto.TipRequest;
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
 * The submitter also receives a best-effort confirmation email (reply-to the relevant team).
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
    private final String informationTo;
    private final String loanTo;
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
            @Value("${app.mail.forms.information:info@hubble.cafe}") String informationTo,
            @Value("${app.mail.forms.loan:loan@hubble.cafe}") String loanTo,
            @Value("${app.mail.from.hubble:noreply@hubble.cafe}") String hubbleFrom,
            @Value("${app.mail.from.meteor:noreply@meteor.cafe}") String meteorFrom) {
        this.mail = mail;
        this.altcha = altcha;
        this.repo = repo;
        this.complaintsTo = complaintsTo;
        this.screensTo = screensTo;
        this.declarationsTo = declarationsTo;
        this.declarationsCc = declarationsCc;
        this.informationTo = informationTo;
        this.loanTo = loanTo;
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

        String confirmation = "Hi " + req.name() + ",\n\n"
                + "Thanks for contacting Meteor. We have received your " + label.toLowerCase()
                + " and the team will look into it.\n\n"
                + "For your records, this is what you sent:\n\n"
                + "Type: " + label + "\n"
                + "Date: " + orDash(req.date()) + "\n\n"
                + "Message:\n" + req.message() + "\n\n"
                + "Kind regards,\nMeteor Community Cafe\n";
        sendConfirmation(meteorFrom, req.email(),
                "We received your " + label.toLowerCase(), confirmation);
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

        String confirmation = "Hi " + req.getName() + ",\n\n"
                + "Thanks! We have received your poster screen request for " + req.getAssociation()
                + " and the screens team will review it.\n\n"
                + "For your records:\n\n"
                + "Cafe: " + cafeLabel(req.getCafe()) + "\n"
                + period + "\n\n"
                + "Kind regards,\nHubble Community Cafe\n";
        sendConfirmation(hubbleFrom, req.getEmail(),
                "We received your poster screen request", confirmation);
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

        String confirmation = "Hi " + req.getFullName() + ",\n\n"
                + "Thanks! We have received your declaration and the treasurer will process it.\n\n"
                + "For your records:\n\n"
                + "Amount in euros: " + amount.toPlainString() + "\n"
                + "Category: " + req.getCategory() + "\n"
                + "Date of purchase: " + req.getDateOfPurchase() + "\n\n"
                + "If anything is unclear we will contact you. \n\n"
                + "Kind regards,\nHubble Community Cafe\n";
        sendConfirmation(hubbleFrom, req.getEmail(),
                "We received your declaration", confirmation);
    }

    // ── Tips / complaints / ideas (Hubble) ───────────────────────────────────────

    public void submitTip(TipRequest req) {
        if (isBot(req.honeypot())) return;
        requireCaptcha(req.altcha());

        String label = switch (req.type()) {
            case "TIP" -> "Tip";
            case "IDEA" -> "Idea";
            default -> "Complaint";
        };
        String body = "New " + label.toLowerCase() + " from the Hubble website\n\n"
                + "Name: " + req.name() + "\n"
                + "Email: " + req.email() + "\n"
                + "Phone: " + orDash(req.phone()) + "\n"
                + "Date: " + orDash(req.date()) + "\n"
                + "Type: " + label + "\n"
                + "Wants updates on this subject: "
                + (Boolean.TRUE.equals(req.wantsUpdates()) ? "Yes" : "No") + "\n\n"
                + "Message:\n" + req.message() + "\n";

        record(FormType.COMPLAINT, req.name(), req.email(), false, body);
        mail.send(new FormEmail(hubbleFrom, complaintsTo, null, req.email(),
                "Hubble " + label + " from " + req.name(), body, List.of()));

        String confirmation = "Hi " + req.name() + ",\n\n"
                + "Thanks for contacting Hubble. We have received your " + label.toLowerCase()
                + " and the team will look into it.\n\n"
                + "For your records, this is what you sent:\n\n"
                + "Type: " + label + "\n"
                + "Date: " + orDash(req.date()) + "\n\n"
                + "Message:\n" + req.message() + "\n\n"
                + "Kind regards,\nHubble Community Cafe\n";
        sendConfirmation(hubbleFrom, req.email(),
                "We received your " + label.toLowerCase(), confirmation);
    }

    // ── Information form (Hubble) ─────────────────────────────────────────────────

    public void submitInformation(InformationRequest req) {
        if (isBot(req.honeypot())) return;
        requireCaptcha(req.altcha());

        String body = "New information request from the Hubble website\n\n"
                + "Name: " + req.name() + "\n"
                + "Email: " + req.email() + "\n"
                + "Phone: " + orDash(req.phone()) + "\n\n"
                + "Message:\n" + req.message() + "\n";

        record(FormType.INFORMATION, req.name(), req.email(), false, body);
        mail.send(new FormEmail(hubbleFrom, informationTo, null, req.email(),
                "Hubble information request from " + req.name(), body, List.of()));

        String confirmation = "Hi " + req.name() + ",\n\n"
                + "Thanks for contacting Hubble. We have received your message and will get back "
                + "to you.\n\n"
                + "For your records:\n\n"
                + "Message:\n" + req.message() + "\n\n"
                + "Kind regards,\nHubble Community Cafe\n";
        sendConfirmation(hubbleFrom, req.email(), "We received your message", confirmation);
    }

    // ── Loan equipment (Hubble) ───────────────────────────────────────────────────

    public void submitLoan(LoanRequest req) {
        if (isBot(req.honeypot())) return;
        requireCaptcha(req.altcha());

        String body = "New loan equipment request from the Hubble website\n\n"
                + "Name: " + req.name() + "\n"
                + "Association: " + req.association() + "\n"
                + "Email: " + req.email() + "\n\n"
                + "Pick-up: " + req.pickupDate() + " at " + req.pickupTime() + "\n"
                + "Return: " + req.returnDate() + " at " + req.returnTime() + "\n\n"
                + "Message:\n" + req.message() + "\n";

        record(FormType.LOAN, req.name(), req.email(), false, body);
        mail.send(new FormEmail(hubbleFrom, loanTo, null, req.email(),
                "Hubble loan request from " + req.name() + " - " + req.association(),
                body, List.of()));

        String confirmation = "Hi " + req.name() + ",\n\n"
                + "Thanks! We have received your equipment loan request for " + req.association()
                + " and the community manager will review it. This is a request, not a confirmed "
                + "booking.\n\n"
                + "For your records:\n\n"
                + "Pick-up: " + req.pickupDate() + " at " + req.pickupTime() + "\n"
                + "Return: " + req.returnDate() + " at " + req.returnTime() + "\n\n"
                + "Kind regards,\nHubble Community Cafe\n";
        sendConfirmation(hubbleFrom, req.email(), "We received your loan request", confirmation);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /**
     * Best-effort acknowledgment to the submitter. The staff notification is already sent, so a
     * failure here (e.g. a bounced confirmation) must not fail the submission.
     */
    private void sendConfirmation(String from, String to, String subject, String body) {
        try {
            // Reply-to stays the site noreply address; this is an acknowledgment, not a thread.
            mail.send(new FormEmail(from, to, null, from, subject, body, List.of()));
        } catch (RuntimeException e) {
            log.warn("Could not send submitter confirmation to {}: {}", to, e.getMessage());
        }
    }

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
