package cafe.community.backend.mail;

import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import static cafe.community.backend.mail.MailTestData.VISITOR_EMAIL;
import static cafe.community.backend.mail.MailTestData.VISITOR_NAME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The SMTP provider (Mailpit in e2e): how a FormEmail becomes a MIME message, and what gets logged. */
@ExtendWith(OutputCaptureExtension.class)
class SmtpFormMailServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final SmtpFormMailService service = new SmtpFormMailService(mailSender);

    SmtpFormMailServiceTest() {
        when(mailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void staffNotificationCarriesAllAddressesAndTheAttachment() throws Exception {
        service.send(MailTestData.staffNotification());

        MimeMessage sent = sent();
        assertThat(addresses(sent.getFrom())).containsExactly("noreply@hubble.cafe");
        assertThat(addresses(sent.getRecipients(Message.RecipientType.TO))).containsExactly("screens@hubble.cafe");
        assertThat(addresses(sent.getRecipients(Message.RecipientType.CC))).containsExactly("board@hubble.cafe");
        assertThat(addresses(sent.getReplyTo())).containsExactly(VISITOR_EMAIL);
        assertThat(sent.getSubject()).isEqualTo("Screen Request from Jane Visitor - Inter Actief");

        List<BodyPart> attachments = attachmentsOf(sent);
        assertThat(attachments).hasSize(1);
        assertThat(attachments.get(0).getFileName()).isEqualTo("poster.png");
        assertThat(attachments.get(0).getContentType()).startsWith("image/png");
    }

    @Test
    void confirmationIsASinglePartTextMailWithoutCc() throws Exception {
        service.send(MailTestData.submitterConfirmation());

        MimeMessage sent = sent();
        assertThat(addresses(sent.getRecipients(Message.RecipientType.TO))).containsExactly(VISITOR_EMAIL);
        assertThat(sent.getRecipients(Message.RecipientType.CC)).isNull();
        assertThat(sent.getContent()).isInstanceOf(String.class);
        assertThat((String) sent.getContent()).contains("Thanks for your message.");
    }

    @Test
    void neverLogsTheVisitorsAddressOrName(CapturedOutput output) {
        service.send(MailTestData.staffNotification());
        service.send(MailTestData.submitterConfirmation());

        assertThat(output.getAll()).contains("Sent form email from noreply@hubble.cafe")
                .doesNotContain(VISITOR_EMAIL).doesNotContain(VISITOR_NAME);
    }

    @Test
    void aFailedSendIsReportedWithoutTheVisitorsAddress(CapturedOutput output) {
        doThrow(new MailSendException("connection refused")).when(mailSender).send(any(MimeMessage.class));

        assertThatThrownBy(() -> service.send(MailTestData.submitterConfirmation()))
                .isInstanceOf(RuntimeException.class);
        assertThat(output.getAll()).contains("Failed to send form email from noreply@meteor.cafe")
                .doesNotContain(VISITOR_EMAIL);
    }

    private MimeMessage sent() {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        MimeMessage message = captor.getValue();
        try {
            message.saveChanges(); // the SMTP transport does this before sending; it sets the part headers
        } catch (jakarta.mail.MessagingException e) {
            throw new IllegalStateException(e);
        }
        return message;
    }

    private static List<String> addresses(jakarta.mail.Address[] addresses) {
        List<String> result = new ArrayList<>();
        for (jakarta.mail.Address a : addresses) {
            result.add(((InternetAddress) a).getAddress());
        }
        return result;
    }

    /** The attachment parts of a (possibly nested) multipart message. */
    private static List<BodyPart> attachmentsOf(Part part) throws Exception {
        List<BodyPart> found = new ArrayList<>();
        if (part.getContent() instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart child = multipart.getBodyPart(i);
                if (Part.ATTACHMENT.equalsIgnoreCase(child.getDisposition())) {
                    found.add(child);
                } else {
                    found.addAll(attachmentsOf(child));
                }
            }
        }
        return found;
    }
}
