package cafe.community.backend.mail;

import com.microsoft.graph.models.FileAttachment;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.graph.users.item.sendmail.SendMailPostRequestBody;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.util.List;

import static cafe.community.backend.mail.MailTestData.VISITOR_EMAIL;
import static cafe.community.backend.mail.MailTestData.VISITOR_NAME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/** The production provider: how a FormEmail becomes a Graph sendMail request, and what gets logged. */
@ExtendWith(OutputCaptureExtension.class)
class GraphFormMailServiceTest {

    private final GraphServiceClient graph = mock(GraphServiceClient.class, RETURNS_DEEP_STUBS);
    private final GraphFormMailService service = new GraphFormMailService(graph);

    @Test
    void sendsAsTheSiteMailboxWithAllAddressesAndTheAttachment() {
        service.send(MailTestData.staffNotification());

        SendMailPostRequestBody request = sentFrom("noreply@hubble.cafe");
        Message message = request.getMessage();
        assertThat(message.getSubject()).isEqualTo("Screen Request from Jane Visitor - Inter Actief");
        assertThat(message.getBody().getContent()).contains("Please show our poster.");
        assertThat(addresses(message.getToRecipients())).containsExactly("screens@hubble.cafe");
        assertThat(addresses(message.getCcRecipients())).containsExactly("board@hubble.cafe");
        assertThat(addresses(message.getReplyTo())).containsExactly(VISITOR_EMAIL);
        assertThat(request.getSaveToSentItems()).isTrue();

        assertThat(message.getAttachments()).hasSize(1);
        FileAttachment attachment = (FileAttachment) message.getAttachments().get(0);
        assertThat(attachment.getName()).isEqualTo("poster.png");
        assertThat(attachment.getContentType()).isEqualTo("image/png");
        assertThat(attachment.getContentBytes()).containsExactly(1, 2, 3, 4);
    }

    @Test
    void confirmationHasNoCcAndNoAttachments() {
        service.send(MailTestData.submitterConfirmation());

        Message message = sentFrom("noreply@meteor.cafe").getMessage();
        assertThat(addresses(message.getToRecipients())).containsExactly(VISITOR_EMAIL);
        assertThat(message.getCcRecipients()).isNullOrEmpty();
        assertThat(message.getAttachments()).isNullOrEmpty();
    }

    @Test
    void neverLogsTheVisitorsAddressOrName(CapturedOutput output) {
        service.send(MailTestData.staffNotification());
        service.send(MailTestData.submitterConfirmation());

        assertThat(output.getAll()).contains("Sent form email from noreply@meteor.cafe via Microsoft Graph")
                .doesNotContain(VISITOR_EMAIL).doesNotContain(VISITOR_NAME);
    }

    @Test
    void aFailedSendIsReportedWithoutTheVisitorsAddress(CapturedOutput output) {
        var sendMail = graph.users().byUserId("noreply@meteor.cafe").sendMail();
        doThrow(new IllegalStateException("Graph unavailable")).when(sendMail).post(any());

        assertThatThrownBy(() -> service.send(MailTestData.submitterConfirmation()))
                .isInstanceOf(RuntimeException.class);
        assertThat(output.getAll()).contains("Failed to send form email from noreply@meteor.cafe")
                .doesNotContain(VISITOR_EMAIL);
    }

    private SendMailPostRequestBody sentFrom(String mailbox) {
        ArgumentCaptor<SendMailPostRequestBody> captor = ArgumentCaptor.forClass(SendMailPostRequestBody.class);
        verify(graph.users().byUserId(mailbox).sendMail()).post(captor.capture());
        return captor.getValue();
    }

    private static List<String> addresses(List<Recipient> recipients) {
        return recipients.stream().map(r -> r.getEmailAddress().getAddress()).toList();
    }
}
