package cafe.community.backend.mail;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import static cafe.community.backend.mail.MailTestData.VISITOR_EMAIL;
import static cafe.community.backend.mail.MailTestData.VISITOR_NAME;
import static org.assertj.core.api.Assertions.assertThat;

/** The log-only provider can be switched on in production while mail is set up, so it must log no personal data. */
@ExtendWith(OutputCaptureExtension.class)
class LoggingFormMailServiceTest {

    @Test
    void logsTheSenderAndShapeButNoRecipientOrSubject(CapturedOutput output) {
        LoggingFormMailService service = new LoggingFormMailService();

        service.send(MailTestData.staffNotification());
        service.send(MailTestData.submitterConfirmation());

        assertThat(output.getAll())
                .contains("[mail:log] would send form email from=noreply@hubble.cafe cc=true replyTo=true attachments=1")
                .contains("[mail:log] would send form email from=noreply@meteor.cafe cc=false replyTo=true attachments=0")
                .doesNotContain(VISITOR_EMAIL).doesNotContain(VISITOR_NAME).doesNotContain("screens@hubble.cafe");
    }
}
