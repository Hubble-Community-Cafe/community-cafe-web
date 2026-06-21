package cafe.community.backend.controller;

import cafe.community.backend.altcha.AltchaService;
import cafe.community.backend.dto.ComplaintRequest;
import cafe.community.backend.dto.DeclarationRequest;
import cafe.community.backend.dto.InformationRequest;
import cafe.community.backend.dto.LoanRequest;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.dto.TipRequest;
import cafe.community.backend.service.FormService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

/**
 * Public, unauthenticated form endpoints. Protected by a honeypot field (in each request),
 * a per-IP rate-limit filter, and server-side validation. Responds 204 on success; honeypot
 * hits also return 204 so bots get no signal.
 */
@RestController
@RequestMapping("/api/forms")
public class PublicFormController {

    private final FormService service;
    private final AltchaService altcha;

    public PublicFormController(FormService service, AltchaService altcha) {
        this.service = service;
        this.altcha = altcha;
    }

    /** A fresh ALTCHA challenge for the form widget to solve. */
    @GetMapping("/challenge")
    public AltchaService.Challenge challenge() {
        return altcha.createChallenge();
    }

    @PostMapping("/complaint")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complaint(@Valid @RequestBody ComplaintRequest req) {
        service.submitComplaint(req);
    }

    @PostMapping("/tips")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void tips(@Valid @RequestBody TipRequest req) {
        service.submitTip(req);
    }

    @PostMapping("/information")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void information(@Valid @RequestBody InformationRequest req) {
        service.submitInformation(req);
    }

    @PostMapping("/loan")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void loan(@Valid @RequestBody LoanRequest req) {
        service.submitLoan(req);
    }

    @PostMapping(path = "/screen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void screen(@Valid @ModelAttribute ScreenRequest req) {
        service.submitScreen(req);
    }

    @PostMapping(path = "/declaration", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void declaration(@Valid @ModelAttribute DeclarationRequest req) {
        service.submitDeclaration(req);
    }
}
