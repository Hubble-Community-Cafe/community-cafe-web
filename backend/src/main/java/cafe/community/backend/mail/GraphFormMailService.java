package cafe.community.backend.mail;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.models.Attachment;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.EmailAddress;
import com.microsoft.graph.models.FileAttachment;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.graph.users.item.sendmail.SendMailPostRequestBody;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/**
 * Production mail provider: sends the form notification through Microsoft Graph (Mail.Send)
 * using the Entra app's client credentials. Active when {@code app.mail.provider=graph}.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "graph")
public class GraphFormMailService implements FormMailService {

    private static final Logger log = LoggerFactory.getLogger(GraphFormMailService.class);

    private final GraphServiceClient graph;

    public GraphFormMailService(
            @Value("${app.mail.graph.tenant-id}") String tenantId,
            @Value("${app.mail.graph.client-id}") String clientId,
            @Value("${app.mail.graph.client-secret}") String clientSecret) {
        ClientSecretCredential credential = new ClientSecretCredentialBuilder()
                .tenantId(tenantId).clientId(clientId).clientSecret(clientSecret).build();
        this.graph = new GraphServiceClient(credential);
        log.info("Microsoft Graph form-mail provider initialised.");
    }

    @Override
    public void send(FormEmail email) {
        try {
            Message message = new Message();
            message.setSubject(email.subject());

            ItemBody body = new ItemBody();
            body.setContentType(BodyType.Text);
            body.setContent(email.body());
            message.setBody(body);

            message.setToRecipients(new LinkedList<>(List.of(recipient(email.to()))));
            if (email.cc() != null && !email.cc().isBlank()) {
                message.setCcRecipients(new LinkedList<>(List.of(recipient(email.cc()))));
            }
            if (email.replyTo() != null && !email.replyTo().isBlank()) {
                message.setReplyTo(new LinkedList<>(List.of(recipient(email.replyTo()))));
            }

            if (email.attachments() != null && !email.attachments().isEmpty()) {
                List<Attachment> attachments = new ArrayList<>();
                for (FormEmail.Attachment a : email.attachments()) {
                    FileAttachment fa = new FileAttachment();
                    fa.setOdataType("#microsoft.graph.fileAttachment");
                    fa.setName(a.filename());
                    fa.setContentType(a.contentType());
                    fa.setContentBytes(a.data());
                    attachments.add(fa);
                }
                message.setAttachments(attachments);
            }

            SendMailPostRequestBody requestBody = new SendMailPostRequestBody();
            requestBody.setMessage(message);
            requestBody.setSaveToSentItems(true);
            // Send as the per-site from address (must be a sendable mailbox in the tenant).
            graph.users().byUserId(email.from()).sendMail().post(requestBody);
            log.info("Sent form notification from {} to {} via Microsoft Graph", email.from(), email.to());
        } catch (Exception e) {
            log.error("Failed to send form notification to {} via Microsoft Graph", email.to(), e);
            throw new RuntimeException("Failed to send form notification", e);
        }
    }

    private Recipient recipient(String address) {
        EmailAddress emailAddress = new EmailAddress();
        emailAddress.setAddress(address);
        Recipient recipient = new Recipient();
        recipient.setEmailAddress(emailAddress);
        return recipient;
    }
}
