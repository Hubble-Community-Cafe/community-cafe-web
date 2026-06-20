package cafe.community.backend.controller;

import cafe.community.backend.dto.ComplaintRequest;
import cafe.community.backend.dto.DeclarationRequest;
import cafe.community.backend.dto.ScreenRequest;
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

    public PublicFormController(FormService service) {
        this.service = service;
    }

    @PostMapping("/complaint")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complaint(@Valid @RequestBody ComplaintRequest req) {
        service.submitComplaint(req);
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
