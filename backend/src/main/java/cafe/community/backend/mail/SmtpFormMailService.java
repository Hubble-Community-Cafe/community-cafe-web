package cafe.community.backend.mail;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * SMTP mail provider, used by the e2e stack (delivering to Mailpit) and any deployment
 * configured with an SMTP server. Active when {@code app.mail.provider=smtp}.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp")
public class SmtpFormMailService implements FormMailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpFormMailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpFormMailService(JavaMailSender mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void send(FormEmail email) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            boolean multipart = email.attachments() != null && !email.attachments().isEmpty();
            MimeMessageHelper helper = new MimeMessageHelper(message, multipart, "UTF-8");
            helper.setFrom(from);
            helper.setTo(email.to());
            if (email.cc() != null && !email.cc().isBlank()) {
                helper.setCc(email.cc());
            }
            if (email.replyTo() != null && !email.replyTo().isBlank()) {
                helper.setReplyTo(email.replyTo());
            }
            helper.setSubject(email.subject());
            helper.setText(email.body(), false);
            if (multipart) {
                for (FormEmail.Attachment a : email.attachments()) {
                    helper.addAttachment(a.filename(), new ByteArrayResource(a.data()), a.contentType());
                }
            }
            mailSender.send(message);
            log.info("Sent form notification to {} (subject '{}')", email.to(), email.subject());
        } catch (Exception e) {
            log.error("Failed to send form notification to {}", email.to(), e);
            throw new RuntimeException("Failed to send form notification", e);
        }
    }
}
