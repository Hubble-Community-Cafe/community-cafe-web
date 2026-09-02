package cafe.community.backend.service;

import cafe.community.backend.altcha.AltchaService;
import cafe.community.backend.dto.ComplaintRequest;
import cafe.community.backend.dto.DeclarationRequest;
import cafe.community.backend.dto.InformationRequest;
import cafe.community.backend.dto.LoanRequest;
import cafe.community.backend.dto.ScreenRequest;
import cafe.community.backend.dto.TipRequest;
import cafe.community.backend.mail.FormMailService;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.repository.FormSubmissionRepository;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Each successful form submission must emit exactly one privacy-safe analytics line on the dedicated
 * APP_ANALYTICS logger, carrying only the form type and (screen and declaration only) the bar,
 * never submitter data.
 */
class FormServiceAnalyticsTest {

    private FormService service;
    private Logger analyticsLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        FormMailService mail = mock(FormMailService.class);
        AltchaService altcha = mock(AltchaService.class);
        when(altcha.verify(any())).thenReturn(true);
        FormSubmissionRepository repo = mock(FormSubmissionRepository.class);

        service = new FormService(mail, altcha, repo,
                "complaints@hubble.cafe", "screens@hubble.cafe", "finance@hubble.cafe", "",
                "finance@meteor.cafe", "", "info@hubble.cafe", "loan@hubble.cafe",
                "noreply@hubble.cafe", "noreply@meteor.cafe");

        analyticsLogger = (Logger) LoggerFactory.getLogger("APP_ANALYTICS");
        analyticsLogger.setLevel(Level.INFO);
        appender = new ListAppender<>();
        appender.start();
        analyticsLogger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        analyticsLogger.detachAppender(appender);
    }

    private List<String> analyticsLines() {
        return appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    @Test
    void complaint_emitsOneLine() {
        service.submitComplaint(
                new ComplaintRequest("Alice", "a@x.com", null, null, "TIP", "hi", null, "ok"));
        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=complaint bar=NONE");
    }

    @Test
    void tip_emitsOneLine() {
        service.submitTip(
                new TipRequest("Bob", "b@x.com", null, null, "TIP", "hi", false, null, "ok"));
        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=tips bar=NONE");
    }

    @Test
    void information_emitsOneLine() {
        service.submitInformation(
                new InformationRequest("Cara", "c@x.com", null, "hi", null, "ok"));
        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=information bar=NONE");
    }

    @Test
    void loan_emitsOneLine() {
        service.submitLoan(new LoanRequest("Dee", "Doppio", "d@x.com",
                "2026-07-01", "10:00", "2026-07-02", "10:00", "hi", null, "ok"));
        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=loan bar=NONE");
    }

    @Test
    void screen_emitsOneLineWithBar() {
        ScreenRequest req = new ScreenRequest();
        req.setName("Eve");
        req.setAssociation("Doppio");
        req.setEmail("e@x.com");
        req.setCafe("HUBBLE");
        req.setPermanent(true);
        req.setHexColor("#FFF200");
        req.setMessage("hi");
        req.setFile(new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3}));
        req.setAltcha("ok");

        service.submitScreen(req);

        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=screen bar=HUBBLE");
    }

    /**
     * The screen form is the only place BOTH can reach the bar dimension (a poster shown on both
     * screens). It is a real value in the shared vocabulary, so it is asserted rather than
     * normalised away.
     */
    @Test
    void screen_forBothCafes_emitsBothAsTheBar() {
        ScreenRequest req = new ScreenRequest();
        req.setName("Eve");
        req.setAssociation("Doppio");
        req.setEmail("e@x.com");
        req.setCafe("BOTH");
        req.setPermanent(true);
        req.setMessage("hi");
        req.setFile(new MockMultipartFile("file", "poster.png", "image/png", new byte[]{1, 2, 3}));
        req.setAltcha("ok");

        service.submitScreen(req);

        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=screen bar=BOTH");
    }

    private DeclarationRequest declaration() {
        DeclarationRequest req = new DeclarationRequest();
        req.setFullName("Finn");
        req.setEmail("f@x.com");
        req.setIban("NL70TRIO0338589016");
        req.setDateOfPurchase("2026-06-20");
        req.setAmount("12,50");
        req.setCategory("Supplies");
        req.setDescription("Cups");
        req.setFile(new MockMultipartFile("file", "receipt.pdf", "application/pdf", new byte[]{1, 2, 3}));
        req.setAltcha("ok");
        return req;
    }

    /**
     * Declarations carry the bar because each cafe has its own treasurer, so the volume per
     * company is what staff want to see. An absent bar is the Hubble form, which posts none.
     */
    @Test
    void declaration_withoutABar_emitsHubble() {
        service.submitDeclaration(declaration());

        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=declaration bar=HUBBLE");
    }

    @Test
    void declaration_fromMeteor_emitsMeteor() {
        DeclarationRequest req = declaration();
        req.setBar(BarLocation.METEOR);

        service.submitDeclaration(req);

        assertThat(analyticsLines())
                .containsExactly("APP_ANALYTICS event=form_submitted form=declaration bar=METEOR");
    }

    @Test
    void noLineWhenHoneypotTriggered() {
        service.submitComplaint(
                new ComplaintRequest("Bot", "bot@x.com", null, null, "TIP", "hi", "i-am-a-bot", "ok"));
        assertThat(analyticsLines()).isEmpty();
    }
}
